"""智能助手后端：加载知识片段；进程内 llama.cpp（GGUF）推理，流式或非流式 NDJSON/json 与前端保持一致。"""
from __future__ import annotations

import importlib
import json
import os
import platform
import sys
import threading
from pathlib import Path
from typing import Any, Dict, Iterable, List


def _ensure_pyinstaller_windows_native_lib_path() -> None:
    """PyInstaller onefile 下尽量避免 DLL 搜索路径污染导致的库错配。"""
    if sys.platform != "win32":
        return
    base = getattr(sys, "_MEIPASS", None)
    if not base:
        return
    # 默认不再把 _MEIPASS 根目录塞进 PATH：
    # 这样可避免 llama.dll 在依赖解析时误命中错误版本的 ggml*.dll（会导致 access violation）。
    # 若需要兼容旧行为可设 CINF_DLL_PATH_LEGACY=1。
    legacy_path_mode = os.environ.get("CINF_DLL_PATH_LEGACY", "").strip() in ("1", "true", "True")
    try:
        if hasattr(os, "add_dll_directory"):
            os.add_dll_directory(base)
    except OSError:
        pass
    if legacy_path_mode:
        prev = os.environ.get("PATH", "")
        parts = prev.split(os.pathsep) if prev else []
        if base not in parts:
            os.environ["PATH"] = base + os.pathsep + prev


_ensure_pyinstaller_windows_native_lib_path()

from win_llama_runtime_env import apply_if_windows

apply_if_windows()

from flask import Response, jsonify, request, stream_with_context

_BACKEND_MODULE_DIR = Path(__file__).resolve().parent
_DEFAULT_KNOWLEDGE_REL = Path("assistant_knowledge")
_DEFAULT_GGUF_REL = Path("models") / "assistant.gguf"


def _resource_root_from_models_gguf_file(p: Path) -> Path | None:
    """若 p 为 .../models/*.gguf，返回资源根（通常为 .../resources/backend），不依赖 exe 布局。"""
    try:
        r = p.expanduser().resolve()
        if r.is_file() and r.suffix.lower() == ".gguf" and r.parent.name.lower() == "models":
            return r.parent.parent
    except OSError:
        pass
    return None


def _backend_runtime_root() -> Path:
    """磁盘上的 backend 资源根目录（含 models、assistant_knowledge）。
    优先级：
    1. CINF_RESOURCE_ROOT（Electron 注入的 resources/backend）
    2. CINF_LLAMACPP_GGUF 指向 .../models/xxx.gguf 时，推导父级资源根（避免仅信任 exe 路径）
    3. PyInstaller exe 路径启发式"""
    def _from_env_gguf() -> Path | None:
        raw = os.environ.get("CINF_LLAMACPP_GGUF", "").strip()
        if not raw:
            return None
        inferred = _resource_root_from_models_gguf_file(Path(raw))
        if inferred is not None and inferred.is_dir():
            return inferred
        return None

    if getattr(sys, "frozen", False) or hasattr(sys, "_MEIPASS"):
        rr = os.environ.get("CINF_RESOURCE_ROOT", "").strip()
        if rr:
            root = Path(rr).expanduser().resolve()
            if root.is_dir():
                return root
        env_gguf_root = _from_env_gguf()
        if env_gguf_root is not None:
            return env_gguf_root
        exe = Path(sys.executable).resolve()
        parent = exe.parent
        pl = parent.name.lower()
        if pl == "dist":
            return parent.parent
        # onedir：.../dist/backend/backend.exe → 资源根为 .../resources/backend
        if pl == "backend" and parent.parent.name.lower() == "dist":
            return parent.parent.parent
        return parent
    rr = os.environ.get("CINF_RESOURCE_ROOT", "").strip()
    if rr:
        p = Path(rr).expanduser().resolve()
        if p.is_dir():
            return p
    env_gguf_root = _from_env_gguf()
    if env_gguf_root is not None:
        return env_gguf_root
    return _BACKEND_MODULE_DIR

_MAX_KNOWLEDGE_CHARS = 14_000
_MAX_SNAPSHOT_JSON = 12_000

_llama_lock = threading.Lock()
_llama_instance: Any = None
_llama_init_error: str | None = None
_llama_import_error: str | None = None
_llama_native_banner_done: bool = False
_llama_native_banner: str | None = None
_llama_native_banner_error: str | None = None
_llama_native_probe_stage: str | None = None

_DISCLAIMER_ZH = (
    "你是 CINF矿山岩体质量分级软件（CINF MRQR）的智能助手。答复仅为软件使用说明与岩体分级计算的工程交流提示，"
    "不构成设计担保、规范的替代或最终工程结论；重大事项须由工程师结合标准与现场判定。"
)

_DISCLAIMER_EN = (
    "You assist users of the CINF Rock Mass Quality & Classification Software. Answers are informal guidance "
    "and software help only—not a substitute for standards, codes, or professional engineering judgment."
)

_MET_UI_HINT_ZH = (
    "软件结构：左侧「岩体分级」选择 BQ / Q / RMR / MRMR；主内容区显示对应公式、参数与计算结果。"
    "可用返回清空当前方法；侧栏底部为了解我们与设置。"
)

_MET_UI_HINT_EN = (
    "UI structure: pick BQ / Q / RMR / MRMR on the left; the main pane shows formula, parameters, and results. "
    "Use Back to clear selection; About and Settings are in the sidebar footer."
)


def _knowledge_dir() -> Path:
    raw = os.environ.get("CINF_ASSISTANT_KNOWLEDGE_DIR", "").strip()
    if raw:
        return Path(raw).expanduser()
    return _backend_runtime_root() / _DEFAULT_KNOWLEDGE_REL


def _explicit_gguf_env() -> bool:
    return bool(os.environ.get("CINF_LLAMACPP_GGUF", "").strip())


def _models_dir_candidates() -> List[Path]:
    """用于 assistant.gguf 与「唯一 *.gguf」回退的 models 目录列表（顺序即搜索顺序）。"""
    candidates: List[Path] = []

    def _add(p: Path) -> None:
        try:
            candidates.append(p.resolve())
        except OSError:
            candidates.append(p)

    _add(_backend_runtime_root() / "models")
    _add(Path.cwd() / "models")
    _add(Path.cwd() / "backend" / "models")
    rr = os.environ.get("CINF_RESOURCE_ROOT", "").strip()
    if rr:
        _add(Path(rr).expanduser() / "models")
    if getattr(sys, "frozen", False) or hasattr(sys, "_MEIPASS"):
        _add(Path(sys.executable).resolve().parent / "models")

    seen: set[Path] = set()
    out: List[Path] = []
    for p in candidates:
        if p not in seen:
            seen.add(p)
            out.append(p)
    return out


def _default_gguf_search_paths() -> List[Path]:
    """开发与打包并存：__file__ 可能在临时目录或 cwd 与 backend 源码目录不一致。"""
    candidates: List[Path] = []

    def _add(p: Path) -> None:
        try:
            candidates.append(p.resolve())
        except OSError:
            candidates.append(p)

    _add(_backend_runtime_root() / _DEFAULT_GGUF_REL)
    _add(Path.cwd() / "models" / "assistant.gguf")
    _add(Path.cwd() / "backend" / "models" / "assistant.gguf")

    rr = os.environ.get("CINF_RESOURCE_ROOT", "").strip()
    if rr:
        _add(Path(rr).expanduser() / "models" / "assistant.gguf")

    if getattr(sys, "frozen", False) or hasattr(sys, "_MEIPASS"):
        _add(Path(sys.executable).resolve().parent / "models" / "assistant.gguf")

    seen: set[Path] = set()
    out: List[Path] = []
    for p in candidates:
        if p not in seen:
            seen.add(p)
            out.append(p)
    return out


def _unique_gguf_in_dir(models_dir: Path) -> Path | None:
    """若目录内仅有一个 *.gguf（非递归），返回该文件；否则返回 None。"""
    if not models_dir.is_dir():
        return None
    files = sorted(
        [
            p
            for p in models_dir.iterdir()
            if p.is_file() and not p.name.startswith(".") and p.suffix.lower() == ".gguf"
        ],
        key=lambda p: p.name.lower(),
    )
    if len(files) == 1:
        return files[0]
    return None


def _first_existing_default_gguf() -> Path | None:
    for p in _default_gguf_search_paths():
        if p.is_file():
            return p
    tried_models: set[Path] = set()
    for models_dir in _models_dir_candidates():
        if models_dir in tried_models:
            continue
        tried_models.add(models_dir)
        fallback = _unique_gguf_in_dir(models_dir)
        if fallback is not None:
            return fallback
    return None


def _resolve_gguf_path() -> Path | None:
    raw = os.environ.get("CINF_LLAMACPP_GGUF", "").strip()
    if raw:
        p = Path(raw).expanduser().resolve()
        return p if p.is_file() else None
    return _first_existing_default_gguf()


def _win32_short_path_if_file(p: Path) -> Path:
    """Windows 下部分 llama.cpp 构建无法打开含中文等非 ASCII 路径的 GGUF；改用 8.3 短路径更稳。"""
    if sys.platform != "win32" or not p.is_file():
        return p
    try:
        import ctypes

        buf = ctypes.create_unicode_buffer(32768)
        n = ctypes.windll.kernel32.GetShortPathNameW(str(p.resolve()), buf, len(buf))
        if n == 0 or n >= len(buf):
            return p
        sp = Path(buf.value)
        return sp if sp.is_file() else p
    except Exception:
        return p


def _gguf_model_path_str_for_llama(p: Path) -> str:
    """传给 Llama(model_path=...) 的路径（Windows 上可能为短路径）。"""
    return str(_win32_short_path_if_file(p.resolve()))


def _llamacpp_n_ctx() -> int:
    try:
        v = int(os.environ.get("CINF_LLAMACPP_N_CTX", "4096"))
        return max(512, min(v, 131072))
    except ValueError:
        return 4096


def _llamacpp_n_gpu_layers() -> int:
    try:
        return int(os.environ.get("CINF_LLAMACPP_N_GPU_LAYERS", "0"))
    except ValueError:
        return 0


def _env_bool_default(name: str, *, default: bool) -> bool:
    raw = os.environ.get(name, "").strip().lower()
    if raw in ("0", "false", "no", "off"):
        return False
    if raw in ("1", "true", "yes", "on"):
        return True
    return default


def _assistant_local_deploy_enabled() -> bool:
    """是否启用本地 AI 部署（无本地 AI 版安装包会显式设为 0）。"""
    return _env_bool_default("CINF_ASSISTANT_LOCAL_DEPLOYMENT", default=True)


def _llamacpp_use_mmap() -> bool:
    """是否用 mmap 映射 GGUF。Windows 上部分环境 mmap 会在 llama 原生层触发 access violation，默认关闭更稳。"""
    # 未设置环境变量时：Windows 默认 False，其它系统默认 True（与 llama-cpp-python 常见用法一致）
    plat_default = sys.platform != "win32"
    return _env_bool_default("CINF_LLAMACPP_USE_MMAP", default=plat_default)


def _llamacpp_use_mlock() -> bool:
    return _env_bool_default("CINF_LLAMACPP_USE_MLOCK", default=False)


def _llamacpp_verbose() -> bool:
    """加载/推理时向 stderr 输出 llama.cpp 详细日志；排障时设 CINF_LLAMACPP_VERBOSE=1。"""
    return _env_bool_default("CINF_LLAMACPP_VERBOSE", default=False)


def _llamacpp_optional_positive_int(name: str) -> int | None:
    raw = os.environ.get(name, "").strip()
    if not raw:
        return None
    try:
        v = int(raw)
        return v if v > 0 else None
    except ValueError:
        return None


def _llamacpp_runtime_llama_cpp_version() -> str:
    try:
        m = importlib.import_module("llama_cpp")
        return str(getattr(m, "__version__", "") or "")
    except Exception:
        return ""


def _llamacpp_runtime_module_file() -> str:
    try:
        m = importlib.import_module("llama_cpp")
        return str(getattr(m, "__file__", "") or "")
    except Exception:
        return ""


def _llamacpp_native_probe_enabled() -> bool:
    """是否执行 llama_backend_init 自检（status 诊断用）。

    在 Windows 打包（PyInstaller frozen）环境中默认关闭，避免少数客户机在探针阶段
    就触发 access violation；需要深度排障时可显式设 CINF_LLAMACPP_NATIVE_PROBE=1。
    """
    raw = os.environ.get("CINF_LLAMACPP_NATIVE_PROBE", "").strip().lower()
    if raw in ("0", "false", "no", "off"):
        return False
    if raw in ("1", "true", "yes", "on"):
        return True
    if sys.platform == "win32" and (getattr(sys, "frozen", False) or hasattr(sys, "_MEIPASS")):
        return False
    return True


def _ensure_llama_cpp_lib_path_env() -> str:
    """在 onefile 下显式固定 llama_cpp/lib，减少 DLL 依赖错配概率。"""
    raw = os.environ.get("LLAMA_CPP_LIB_PATH", "").strip()
    if raw:
        return raw
    base = getattr(sys, "_MEIPASS", None)
    if not base:
        return ""
    cand = Path(base) / "llama_cpp" / "lib"
    if cand.is_dir():
        os.environ["LLAMA_CPP_LIB_PATH"] = str(cand)
        return str(cand)
    return ""


def _collect_llama_lib_candidates() -> Dict[str, Any]:
    """收集运行时 llama/ggml 相关库路径，便于定位 DLL 混载。"""
    out: Dict[str, Any] = {
        "llamaCppLibPathEnv": os.environ.get("LLAMA_CPP_LIB_PATH", "").strip(),
        "meipass": str(getattr(sys, "_MEIPASS", "") or ""),
        "libDirExists": False,
        "libDirFiles": [],
        "meipassDllCandidates": [],
    }
    lib_dir = out["llamaCppLibPathEnv"]
    if lib_dir:
        p = Path(lib_dir)
        out["libDirExists"] = p.is_dir()
        if p.is_dir():
            try:
                out["libDirFiles"] = sorted([x.name for x in p.glob("*.dll")])
            except OSError:
                out["libDirFiles"] = []
    meipass = out["meipass"]
    if meipass:
        mp = Path(meipass)
        if mp.is_dir():
            try:
                names = []
                for x in mp.glob("*.dll"):
                    n = x.name.lower()
                    if "llama" in n or "ggml" in n:
                        names.append(x.name)
                out["meipassDllCandidates"] = sorted(names)
            except OSError:
                out["meipassDllCandidates"] = []
    return out


def _llama_lib_diag_summary(diag: Dict[str, Any]) -> Dict[str, str]:
    """把数组字段展开为可读字符串，避免 PowerShell 默认格式把数组折叠成 System.Object[]。"""
    lib_files = diag.get("libDirFiles") or []
    meipass_hits = diag.get("meipassDllCandidates") or []
    return {
        "llamaCppLibPathEnv": str(diag.get("llamaCppLibPathEnv") or ""),
        "libDirFilesCsv": ", ".join(str(x) for x in lib_files),
        "meipassDllCandidatesCsv": ", ".join(str(x) for x in meipass_hits),
    }


def _safe_llama_native_build_banner() -> str | None:
    """初始化 backend 一次并读取 llama_print_system_info（含 GGML_AVX 等），用于排查 SIMD/GPU 能力与崩溃。"""
    global _llama_native_banner_done, _llama_native_banner, _llama_native_banner_error, _llama_native_probe_stage
    if _llama_native_banner_done:
        return _llama_native_banner
    _llama_native_banner_done = True
    _llama_native_banner_error = None
    _llama_native_probe_stage = "import llama_cpp.llama_cpp"
    try:
        _ensure_llama_cpp_lib_path_env()
        lc = importlib.import_module("llama_cpp.llama_cpp")
        _llama_native_probe_stage = "llama_backend_init"
        lc.llama_backend_init()
        _llama_native_probe_stage = "llama_print_system_info"
        raw = lc.llama_print_system_info()
        _llama_native_banner = (
            raw.decode("utf-8", errors="replace").strip() if raw else ""
        )
        if not _llama_native_banner:
            _llama_native_banner_error = "llama_print_system_info returned empty bytes"
        _llama_native_probe_stage = "ok"
    except Exception as exc:
        _llama_native_banner = ""
        _llama_native_banner_error = f"{type(exc).__name__}: {exc}"
    return _llama_native_banner if _llama_native_banner else None


def _runtime_platform_diag() -> Dict[str, str]:
    """返回可快速比对 wheel 与目标机 ABI/SIMD 的平台字段。"""
    return {
        "pythonVersion": sys.version.split(" ")[0],
        "pythonArch": platform.architecture()[0],
        "machine": platform.machine(),
        "processor": platform.processor(),
        "platform": platform.platform(),
    }


def _inference_failure_hint(exc: BaseException) -> str:
    base = (
        "嵌入式推理失败：检查 CINF_LLAMACPP_GGUF、GGUF 是否与当前 llama.cpp 构建匹配，或查阅 backend/README_ASSISTANT_LLM.txt。"
    )
    detail = str(exc).lower()
    if "access violation" not in detail and "reading 0x" not in detail:
        return base
    return (
        base
        + " 当前错误像原生层空指针或 SIMD 与预编译 GGML 不匹配：请在 GET /api/assistant/status 查看 llamaNativeBuildInfo（是否含 GGML_AVX2 等）；"
        "若目标 CPU 不支持对应指令集，须换用无 AVX2 的 llama-cpp-python wheel 或在相近 CPU 上重打包。"
        " 可暂时设环境变量 CINF_LLAMACPP_VERBOSE=1 重试 chat 查看原生 stderr。"
    )


def _llamacpp_temperature() -> float:
    try:
        return float(os.environ.get("CINF_LLAMACPP_TEMPERATURE", "0.35"))
    except ValueError:
        return 0.35


def _llamacpp_max_tokens() -> int:
    try:
        v = int(os.environ.get("CINF_LLAMACPP_MAX_TOKENS", "2048"))
        return max(64, min(v, 8192))
    except ValueError:
        return 2048


def _llamacpp_top_p() -> float:
    try:
        return float(os.environ.get("CINF_LLAMACPP_TOP_P", "0.9"))
    except ValueError:
        return 0.9


def _llamacpp_top_k() -> int:
    try:
        v = int(os.environ.get("CINF_LLAMACPP_TOP_K", "40"))
        return max(1, min(v, 100000))
    except ValueError:
        return 40


def _llamacpp_repeat_penalty() -> float:
    """>1 抑制循环复读；过小易复读，过大易跑题。"""
    try:
        v = float(os.environ.get("CINF_LLAMACPP_REPEAT_PENALTY", "1.18"))
        return max(1.0, min(v, 2.0))
    except ValueError:
        return 1.18


def _llamacpp_frequency_penalty() -> float:
    try:
        return float(os.environ.get("CINF_LLAMACPP_FREQUENCY_PENALTY", "0.08"))
    except ValueError:
        return 0.08


def _llamacpp_stop_sequences() -> List[str]:
    """与常见 Qwen/ChatML 句末分隔符对齐，避免生成在轮次结束前空转复读。"""
    raw = os.environ.get("CINF_LLAMACPP_STOP", "").strip()
    if raw == "-" or raw.lower() == "none":
        return []
    if raw:
        return [s.strip().replace("\\n", "\n") for s in raw.split(",") if s.strip()]
    return ["<|im_end|>", "<|endoftext|>"]


def _llamacpp_chat_format_kw() -> Dict[str, Any]:
    """设 CINF_LLAMACPP_CHAT_FORMAT=qwen（或 chatml）可强行指定；auto/空则交由 GGUF/libr默认值。"""
    raw = os.environ.get("CINF_LLAMACPP_CHAT_FORMAT", "").strip().lower()
    if not raw or raw in ("auto", "default"):
        return {}
    return {"chat_format": raw}


def _llamacpp_completion_kwargs(
    *,
    stream: bool,
) -> Dict[str, Any]:
    out: Dict[str, Any] = {
        "stream": stream,
        "temperature": _llamacpp_temperature(),
        "max_tokens": _llamacpp_max_tokens(),
        "top_p": _llamacpp_top_p(),
        "top_k": _llamacpp_top_k(),
        "repeat_penalty": _llamacpp_repeat_penalty(),
        "frequency_penalty": _llamacpp_frequency_penalty(),
    }
    stops = _llamacpp_stop_sequences()
    if stops:
        out["stop"] = stops
    return out


def _try_import_llamacpp() -> bool:
    global _llama_import_error
    _llama_import_error = None
    try:
        importlib.import_module("llama_cpp")
        return True
    except Exception as e:
        _llama_import_error = f"{type(e).__name__}: {e}"
        return False


def _get_llama():
    global _llama_instance, _llama_init_error
    if _llama_init_error is not None:
        raise RuntimeError(_llama_init_error)
    if _llama_instance is not None:
        return _llama_instance
    path = _resolve_gguf_path()
    if path is None:
        exp = os.environ.get("CINF_LLAMACPP_GGUF", "").strip()
        hint = (
            f"未找到 GGUF：已配置 CINF_LLAMACPP_GGUF={exp!r} 但路径不可用；"
            f"或未放置默认模型文件 {_DEFAULT_GGUF_REL}（相对于 backend 目录），"
            f"或在某一 models 目录内仅放置一个 .gguf 文件。"
        )
        raise RuntimeError(hint)
    try:
        _ensure_llama_cpp_lib_path_env()
        Llama = importlib.import_module("llama_cpp").Llama
    except ImportError as e:
        _llama_init_error = (
            "未安装 llama-cpp-python（完全离线嵌入式推理所需）。构建环境请 pip install llama-cpp-python。"
        )
        raise RuntimeError(_llama_init_error) from e
    try:
        n_gl = _llamacpp_n_gpu_layers()
        ctor_kw: Dict[str, Any] = dict(
            model_path=_gguf_model_path_str_for_llama(path),
            n_ctx=_llamacpp_n_ctx(),
            n_gpu_layers=n_gl,
            verbose=_llamacpp_verbose(),
            use_mmap=_llamacpp_use_mmap(),
            use_mlock=_llamacpp_use_mlock(),
            offload_kqv=n_gl > 0,
            flash_attn=False,
        )
        nt = _llamacpp_optional_positive_int("CINF_LLAMACPP_N_THREADS")
        if nt is not None:
            ctor_kw["n_threads"] = nt
        ntb = _llamacpp_optional_positive_int("CINF_LLAMACPP_N_THREADS_BATCH")
        if ntb is not None:
            ctor_kw["n_threads_batch"] = ntb
        ctor_kw.update(_llamacpp_chat_format_kw())
        _llama_instance = Llama(**ctor_kw)
        _llama_init_error = None
    except Exception as e:
        _llama_init_error = f"加载 GGUF 失败: {e}"
        raise RuntimeError(_llama_init_error) from e
    return _llama_instance


def _knowledge_path_skipped(p: Path, root: Path) -> bool:
    try:
        rel = p.relative_to(root)
    except ValueError:
        return True
    return any(part.startswith(".") for part in rel.parts)


def load_knowledge_snippet() -> str:
    """递归读取知识目录下 *.md / *.txt，按相对路径排序合并；跳过隐藏路径段与隐藏文件。"""
    d = _knowledge_dir()
    if not d.is_dir():
        return ""
    paths: List[Path] = []
    for pattern in ("*.md", "*.txt"):
        for p in d.rglob(pattern):
            if not p.is_file() or _knowledge_path_skipped(p, d):
                continue
            paths.append(p)
    paths = sorted({p.resolve() for p in paths}, key=lambda p: str(p.relative_to(d)).lower())
    chunks: List[str] = []
    total = 0
    for p in paths:
        try:
            text = p.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        try:
            rel = p.relative_to(d)
            label = str(rel).replace("\\", "/")
        except ValueError:
            label = p.name
        block = f"--- 文件 {label} ---\n{text.strip()}\n"
        if total + len(block) > _MAX_KNOWLEDGE_CHARS:
            remain = _MAX_KNOWLEDGE_CHARS - total
            if remain > 80:
                block = block[:remain] + "\n…(truncated)\n"
            else:
                break
        chunks.append(block)
        total += len(block)
        if total >= _MAX_KNOWLEDGE_CHARS:
            break
    return "\n".join(chunks)


def check_llamacpp_status() -> Dict[str, Any]:
    global _llama_native_probe_stage, _llama_native_banner_error, _llama_native_banner
    local_deploy_enabled = _assistant_local_deploy_enabled()
    if not local_deploy_enabled:
        lib_diag = _collect_llama_lib_candidates()
        failure_diagnostic_zh = (
            "当前安装包未启用本地 AI 部署。"
            "如需 AI 本地部署功能，请联系开发团队。"
        )
        failure_diagnostic_en = (
            "This installer does not include local AI deployment. "
            "Contact the development team if you need local AI deployment capability."
        )
        return {
            "configuredModel": "",
            "modelPresent": False,
            "models": [],
            "error": "local AI deployment disabled by package variant",
            "ggufPath": "",
            "importOk": False,
            "importDetail": "",
            "initError": "",
            "inferenceReady": False,
            "ggufBackendDir": str(_backend_runtime_root()),
            "ggufSearchTried": [str(p) for p in _default_gguf_search_paths()],
            "modelsDirsScanned": [str(p) for p in _models_dir_candidates()],
            "failureDiagnosticZh": failure_diagnostic_zh,
            "failureDiagnosticEn": failure_diagnostic_en,
            "ggufPathForLoader": "",
            "llamaUseMmap": _llamacpp_use_mmap(),
            "llamaUseMlock": _llamacpp_use_mlock(),
            "llamaCppPythonVersion": "",
            "llamaCppModulePath": "",
            "llamaNativeBuildInfo": "",
            "llamaNativeBuildInfoError": "",
            "llamaNativeProbeStage": "disabled-by-package",
            "llamaNativeProbeEnabled": False,
            "llamaOffloadKqvDefault": False,
            "runtimePlatform": _runtime_platform_diag(),
            "llamaRuntimeLibDiag": lib_diag,
            "llamaRuntimeLibDiagSummary": _llama_lib_diag_summary(lib_diag),
            "backendSysFrozen": bool(getattr(sys, "frozen", False)),
            "backendExecutablePath": sys.executable,
            "cinfResourceRootEnv": os.environ.get("CINF_RESOURCE_ROOT", "").strip(),
            "cinfLlamaCppGgufEnv": os.environ.get("CINF_LLAMACPP_GGUF", "").strip(),
            "localDeploymentEnabled": False,
        }

    import_ok = _try_import_llamacpp()
    _ensure_llama_cpp_lib_path_env()
    path = _resolve_gguf_path()
    file_ok = path is not None
    err: str | None = None
    if not import_ok:
        err = "llama-cpp-python 未安装或无法导入"
        if _llama_import_error:
            err = f"{err} ({_llama_import_error})"
    elif not file_ok:
        if _explicit_gguf_env():
            err = "CINF_LLAMACPP_GGUF 指向的文件不存在"
        else:
            err = (
                f"未找到嵌入式模型：请将 GGUF 置于 {_DEFAULT_GGUF_REL}（相对于 backend）、"
                f"或在某一 models 目录内仅放一个 .gguf，或设置 CINF_LLAMACPP_GGUF。"
            )
    elif _llama_init_error:
        err = _llama_init_error
    ready = import_ok and file_ok and not _llama_init_error

    # 供桌面端简短区分「依赖未打进包」vs「权重未随包」，避免误判为仅靠路径配置即可修复
    failure_diagnostic_zh = ""
    failure_diagnostic_en = ""
    if not ready:
        if not import_ok:
            failure_diagnostic_zh = (
                "【诊断】未成功导入 llama-cpp-python，本地 GGUF 无法加载。"
                " 请确认使用 npm run dist:win:ai 或 dist:win:noai 完整打包（含 PyInstaller backend.exe），"
                "且 llama_cpp 已打入 exe（参见 backend/README_ASSISTANT_LLM.txt）。"
            )
            failure_diagnostic_en = (
                "[Diagnosis] llama-cpp-python failed to import; GGUF inference cannot run. "
                "Rebuild with npm run dist:win:ai / dist:win:noai so backend.exe includes PyInstaller-collected llama_cpp "
                "(see backend/README_ASSISTANT_LLM.txt)."
            )
        elif not file_ok:
            failure_diagnostic_zh = (
                "【诊断】依赖已就绪，但未找到可用的 GGUF 文件。"
                f" {err or ''} "
                "已扫描的 models 目录见 modelsDirsScanned。"
            )
            failure_diagnostic_en = (
                "[Diagnosis] llama-cpp-python is importable but no GGUF was resolved. "
                f"{err or ''} "
                "See modelsDirsScanned for directories checked."
            )
        else:
            failure_diagnostic_zh = (
                "【诊断】模型文件与依赖已找到，但初始化失败。"
                f" {err or ''} "
                "请先尝试安装 VC++ 2015-2022 x64 运行库，并排除杀毒/EDR 对安装目录 DLL 的拦截。"
            )
            failure_diagnostic_en = (
                "[Diagnosis] GGUF and llama-cpp-python are present, but model init failed. "
                f"{err or ''} "
                "Install VC++ 2015-2022 x64 runtime and exclude the install folder from aggressive AV/EDR scanning."
            )

    models_dirs_scan = [str(p) for p in _models_dir_candidates()]
    gguf_loader = ""
    if path is not None and path.is_file():
        try:
            gguf_loader = _gguf_model_path_str_for_llama(path)
        except OSError:
            gguf_loader = str(path)

    ver = _llamacpp_runtime_llama_cpp_version() if import_ok else ""
    mod_file = _llamacpp_runtime_module_file() if import_ok else ""
    native_probe_enabled = import_ok and _llamacpp_native_probe_enabled()
    if native_probe_enabled:
        native_banner = _safe_llama_native_build_banner()
    else:
        native_banner = None
        if import_ok:
            _llama_native_probe_stage = "disabled"
            _llama_native_banner_error = ""
            _llama_native_banner = ""
    platform_diag = _runtime_platform_diag()
    lib_diag = _collect_llama_lib_candidates()
    lib_diag_summary = _llama_lib_diag_summary(lib_diag)

    rr_env = os.environ.get("CINF_RESOURCE_ROOT", "").strip()
    gguf_env = os.environ.get("CINF_LLAMACPP_GGUF", "").strip()
    exe_path = sys.executable

    return {
        "configuredModel": path.name if path else "",
        "modelPresent": file_ok,
        "models": [path.name] if path else [],
        "error": err,
        "ggufPath": str(path) if path else "",
        "importOk": import_ok,
        "importDetail": _llama_import_error,
        "initError": _llama_init_error,
        "inferenceReady": ready,
        "ggufBackendDir": str(_backend_runtime_root()),
        "ggufSearchTried": [str(p) for p in _default_gguf_search_paths()],
        "modelsDirsScanned": models_dirs_scan,
        "failureDiagnosticZh": failure_diagnostic_zh,
        "failureDiagnosticEn": failure_diagnostic_en,
        "ggufPathForLoader": gguf_loader,
        "llamaUseMmap": _llamacpp_use_mmap(),
        "llamaUseMlock": _llamacpp_use_mlock(),
        "llamaCppPythonVersion": ver,
        "llamaCppModulePath": mod_file,
        "llamaNativeBuildInfo": native_banner,
        "llamaNativeBuildInfoError": _llama_native_banner_error,
        "llamaNativeProbeStage": _llama_native_probe_stage,
        "llamaNativeProbeEnabled": native_probe_enabled,
        "llamaOffloadKqvDefault": _llamacpp_n_gpu_layers() > 0,
        "runtimePlatform": platform_diag,
        "llamaRuntimeLibDiag": lib_diag,
        "llamaRuntimeLibDiagSummary": lib_diag_summary,
        "backendSysFrozen": bool(getattr(sys, "frozen", False)),
        "backendExecutablePath": exe_path,
        "cinfResourceRootEnv": rr_env,
        "cinfLlamaCppGgufEnv": gguf_env,
        "localDeploymentEnabled": local_deploy_enabled,
    }


def _build_system(locale: str, snapshot: Any, knowledge_text: str) -> str:
    if locale == "en":
        disclaimer = _DISCLAIMER_EN
        nav_rule = (
            "If you want the UI to switch to a specific sheet tab, append exactly one line at the END of your reply: "
            "`[[ACTION:NAVIGATE:sheet_id]]` where sheet_id MUST be one of: raw_material, product, heat_balance, furnace. "
            "Do not invent ids."
        )
        ui_hint = _MET_UI_HINT_EN
    else:
        disclaimer = _DISCLAIMER_ZH
        nav_rule = (
            "若需要帮用户切换到某一主内容页签，在回复末尾单独一行输出："
            "`[[ACTION:NAVIGATE:sheet_id]]`，其中 sheet_id 必须是 raw_material、product、heat_balance、furnace 之一；不得编造。"
        )
        ui_hint = _MET_UI_HINT_ZH

    snap_s = ""
    try:
        snap_s = json.dumps(snapshot, ensure_ascii=False, indent=0)
    except (TypeError, ValueError):
        snap_s = str(snapshot)
    if len(snap_s) > _MAX_SNAPSHOT_JSON:
        snap_s = snap_s[:_MAX_SNAPSHOT_JSON] + "\n…(truncated)"

    parts = [
        disclaimer,
        nav_rule,
        ui_hint,
        "--- 分级方法 method_id ---",
        "bq=BQ分级；q=Q分级；rmr=RMR分级；mrmr=MRMR分级。",
        "--- 客户端上下文 snapshot (JSON) ---",
        snap_s,
    ]
    if knowledge_text:
        parts.extend(["--- 附加知识库 ---", knowledge_text.strip()])
    return "\n\n".join(parts)


def _normalize_messages(history: Any) -> List[Dict[str, str]]:
    if not isinstance(history, list):
        return []
    out: List[Dict[str, str]] = []
    for item in history:
        if not isinstance(item, dict):
            continue
        role = item.get("role")
        content = item.get("content")
        if role not in ("user", "assistant") or content is None:
            continue
        text = str(content).strip()
        if not text:
            continue
        out.append({"role": role, "content": text})
    return out[-40:]


def register_assistant_routes(app) -> None:
    @app.route("/api/assistant/status", methods=["GET"])
    def assistant_status():
        kb = load_knowledge_snippet()
        lm = check_llamacpp_status()
        base: Dict[str, Any] = {
            "inferenceBackend": "llamacpp",
            "knowledgeDir": str(_knowledge_dir()),
            "knowledgeLoadedChars": len(kb),
        }
        base.update(lm)
        return jsonify(base)

    @app.route("/api/assistant/chat", methods=["POST"])
    def assistant_chat():
        data = request.get_json(silent=True) or {}
        locale = data.get("locale") or "zh"
        if locale not in ("zh", "en"):
            locale = "zh"
        snapshot = data.get("snapshot")
        messages = _normalize_messages(data.get("messages"))
        if not messages:
            return jsonify({"success": False, "error": "messages required"}), 400
        if not _assistant_local_deploy_enabled():
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "local AI deployment is disabled in this package variant",
                        "hint": (
                            "当前安装包未启用本地 AI 部署；如需 AI 本地部署功能，请联系开发团队。"
                            if locale != "en"
                            else "This installer does not include local AI deployment. Contact the development team if needed."
                        ),
                        "inferenceBackend": "llamacpp",
                    }
                ),
                503,
            )

        stream = bool(data.get("stream"))
        knowledge_text = load_knowledge_snippet()
        system_content = _build_system(locale, snapshot, knowledge_text)
        chat_messages: List[Dict[str, str]] = [{"role": "system", "content": system_content}, *messages]

        return _llamacpp_chat_response(chat_messages, stream)


def _llamacpp_chat_response(chat_messages: List[Dict[str, str]], stream: bool) -> Any:
    if stream:

        def generate() -> Iterable[str]:
            try:
                with _llama_lock:
                    llm = _get_llama()
                    kw = _llamacpp_completion_kwargs(stream=True)
                    sc = llm.create_chat_completion(messages=chat_messages, **kw)
                    for chunk in sc:
                        choices = chunk.get("choices") or []
                        if not choices:
                            continue
                        delta = choices[0].get("delta") or {}
                        c = delta.get("content") or ""
                        if c:
                            yield json.dumps({"content": str(c)}, ensure_ascii=False) + "\n"
            except Exception as ex:
                yield json.dumps({"error": str(ex)}, ensure_ascii=False) + "\n"

        return Response(
            stream_with_context(generate()),
            mimetype="application/x-ndjson",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    try:
        with _llama_lock:
            llm = _get_llama()
            kw = _llamacpp_completion_kwargs(stream=False)
            out = llm.create_chat_completion(messages=chat_messages, **kw)
    except Exception as e:
        return (
            jsonify(
                {
                    "success": False,
                    "error": str(e),
                    "hint": _inference_failure_hint(e),
                    "inferenceBackend": "llamacpp",
                }
            ),
            503,
        )

    content = ""
    try:
        choices = out.get("choices") or []
        if choices:
            msg = choices[0].get("message") or {}
            content = str(msg.get("content") or "")
    except (TypeError, AttributeError, KeyError):
        content = ""

    path = _resolve_gguf_path()
    return jsonify(
        {
            "success": True,
            "message": content,
            "model": path.name if path else "",
            "inferenceBackend": "llamacpp",
            "raw": out,
        }
    )
