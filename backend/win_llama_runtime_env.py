"""Windows 下在导入 numpy / matplotlib / llama_cpp 之前尽早设置环境变量，降低 OpenMP 多实例与 ggml 在 llama_backend_init 阶段冲突导致的访问冲突。"""
from __future__ import annotations

import os
import sys


def apply_if_windows() -> None:
    if sys.platform != "win32":
        return
    # Intel/MKL 与其它 OpenMP 共存（常见为访问冲突根因之一）
    os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")
    # 限制各 BLAS/OpenMP 线程，避免与 ggml 内部调度争用（可用环境变量覆盖）
    os.environ.setdefault("OMP_NUM_THREADS", "1")
    os.environ.setdefault("MKL_NUM_THREADS", "1")
    os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
    os.environ.setdefault("NUMEXPR_NUM_THREADS", "1")
    os.environ.setdefault("VECLIB_MAXIMUM_THREADS", "1")
    # 强制走 CPU 路径初始化，避免 probing 其它后端时异常
    os.environ.setdefault("CUDA_VISIBLE_DEVICES", "")
    os.environ.setdefault("HIP_VISIBLE_DEVICES", "")
