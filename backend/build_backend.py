"""
将 Flask 后端打包为 backend.exe（PyInstaller）。
"""
from __future__ import annotations

import glob
import os
import shutil
import sys


def get_site_packages_dirs():
    import site

    dirs = []
    for sp in site.getsitepackages():
        sp = os.path.abspath(sp)
        if os.path.isdir(sp):
            dirs.append(sp)
    if site.USER_SITE and os.path.isdir(site.USER_SITE):
        dirs.append(os.path.abspath(site.USER_SITE))
    if not dirs:
        sp = os.path.join(os.path.dirname(sys.executable), "..", "Lib", "site-packages")
        sp = os.path.abspath(sp)
        if os.path.isdir(sp):
            dirs.append(sp)
    return dirs


def hide_pathlib_backport(site_packages):
    renamed = []
    p = os.path.join(site_packages, "pathlib.py")
    if os.path.isfile(p):
        bak = p + ".pyinstaller_bak"
        try:
            os.rename(p, bak)
            renamed.append((p, bak))
        except Exception as e:
            print(f"WARNING: 无法重命名 {p}: {e}")
    pdir = os.path.join(site_packages, "pathlib")
    if os.path.isdir(pdir):
        bak = pdir + ".pyinstaller_bak"
        try:
            os.rename(pdir, bak)
            renamed.append((pdir, bak))
        except Exception as e:
            print(f"WARNING: 无法重命名目录 {pdir}: {e}")
    for d in glob.glob(os.path.join(site_packages, "pathlib-*.dist-info")):
        bak = d + ".pyinstaller_bak"
        try:
            os.rename(d, bak)
            renamed.append((d, bak))
        except Exception as e:
            print(f"WARNING: 无法重命名 {d}: {e}")
    return renamed


def restore_pathlib_backport(renamed):
    for orig, bak in reversed(renamed):
        try:
            if os.path.exists(bak):
                os.rename(bak, orig)
        except Exception as e:
            print(f"WARNING: 无法恢复 {bak} -> {orig}: {e}")


def local_ai_pack_enabled() -> bool:
    raw = os.environ.get("CINF_PACK_LOCAL_AI", "1").strip().lower()
    return raw not in ("0", "false", "off", "no")


def remove_path(path):
    if os.path.isdir(path):
        shutil.rmtree(path)
    elif os.path.exists(path):
        os.remove(path)


def clean_previous_pyinstaller_outputs(current_dir):
    dist_dir = os.path.join(current_dir, "dist")
    build_dir = os.path.join(current_dir, "build")
    stale_paths = [
        os.path.join(build_dir, "backend"),
        os.path.join(dist_dir, "backend.exe"),
        os.path.join(dist_dir, "backend"),
    ]
    for p in stale_paths:
        if os.path.exists(p):
            remove_path(p)
            print(f"Removed stale PyInstaller output: {p}")


def main():
    site_dirs = get_site_packages_dirs()
    if not site_dirs:
        print("ERROR: 无法确定 site-packages 目录")
        sys.exit(1)

    renamed = []
    for site_packages in site_dirs:
        pathlib_files = []
        pathlib_files.extend(glob.glob(os.path.join(site_packages, "pathlib.py")))
        pathlib_files.extend(glob.glob(os.path.join(site_packages, "pathlib")))
        pathlib_files.extend(glob.glob(os.path.join(site_packages, "pathlib-*.dist-info")))
        if pathlib_files:
            renamed.extend(hide_pathlib_backport(site_packages))

    try:
        import PyInstaller.__main__
    except ImportError as e:
        restore_pathlib_backport(renamed)
        print(f"ERROR: 无法导入 PyInstaller: {e}")
        sys.exit(1)

    current_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(current_dir)

    pack_local_ai = local_ai_pack_enabled()
    if pack_local_ai:
        try:
            import llama_cpp  # noqa: F401
        except Exception as e:
            restore_pathlib_backport(renamed)
            print("ERROR: 当前 Python 环境无法导入 llama_cpp（嵌入式助手需要 llama-cpp-python）。")
            print(
                '  pip install llama-cpp-python --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cpu'
            )
            print(f"详情: {e}")
            sys.exit(1)

    onefile_mode = os.environ.get("CINF_PYINSTALLER_MODE", "onefile").strip().lower() != "onedir"
    clean_previous_pyinstaller_outputs(current_dir)

    args = [
        "app.py",
        "--name=backend",
        "--clean",
        "--noconsole",
        "--hidden-import=flask",
        "--hidden-import=flask_cors",
        "--hidden-import=assistant_api",
        "--hidden-import=win_llama_runtime_env",
        "--collect-all=flask",
        "--collect-all=flask_cors",
    ]
    if pack_local_ai:
        args.extend(
            [
                "--hidden-import=llama_cpp",
                "--hidden-import=llama_cpp.llama_cpp",
                "--collect-all=llama_cpp",
            ]
        )
    if onefile_mode:
        args.append("--onefile")
    else:
        args.append("--onedir")

    if sys.platform == "win32":
        args.append("--icon=NONE")

    print("\n开始打包 Python 后端…")
    print(f'打包模式: {"onefile" if onefile_mode else "onedir"}')
    print(f'本地 AI: {"启用" if pack_local_ai else "禁用"}')

    try:
        PyInstaller.__main__.run(args)
        print("\nSUCCESS: backend.exe 构建完成")
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)
    finally:
        restore_pathlib_backport(renamed)


if __name__ == "__main__":
    main()
