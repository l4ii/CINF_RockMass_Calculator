# -*- coding: utf-8 -*-
"""把 frontend/public 中的 Logo 分配到安装包 / 桌面 / 界面使用的标准文件名。

来源（按存在优先）：
  logoico.ico / icon.ico  → 安装向导、卸载程序图标（保持用户提供的 ICO）
  logopng.png / icon.png  → 界面、闪屏；并生成含 256 的 ICO 供 exe / 桌面快捷方式
  logosvg.svg             → 保留为矢量源，同时复制为 icon.svg
"""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print('ERROR: 需要 Pillow。请先执行: pip install Pillow', file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'frontend' / 'public'
BUILD = ROOT / 'electron' / 'build'
DIST = ROOT / 'frontend' / 'dist'
ICO_SIZES = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]


def first_existing(*names: str) -> Path | None:
    for name in names:
        path = PUBLIC / name
        if path.is_file():
            return path
    return None


def to_square(img: Image.Image) -> Image.Image:
    img = img.convert('RGBA')
    width, height = img.size
    side = max(width, height)
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.paste(img, ((side - width) // 2, (side - height) // 2), img)
    return canvas


def copy_file(src: Path, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if src.resolve() == dest.resolve():
        return
    shutil.copy2(src, dest)
    print(f'  {src.relative_to(ROOT)} -> {dest.relative_to(ROOT)}')


def main() -> int:
    ico_src = first_existing('logoico.ico', 'icon.ico')
    png_src = first_existing('logopng.png', 'icon.png')
    svg_src = first_existing('logosvg.svg', 'icon.svg')

    if png_src is None:
        print('ERROR: 未找到 frontend/public/logopng.png 或 icon.png', file=sys.stderr)
        return 1
    if ico_src is None:
        print('ERROR: 未找到 frontend/public/logoico.ico 或 icon.ico', file=sys.stderr)
        return 1

    BUILD.mkdir(parents=True, exist_ok=True)
    print('分配软件图标:')

    # 界面 / favicon / 许可页：PNG
    ui_png = PUBLIC / 'icon.png'
    copy_file(png_src, ui_png)
    if DIST.is_dir():
        copy_file(png_src, DIST / 'icon.png')

    # 闪屏 / Linux：PNG（方形 512，减小体积）
    png_img = to_square(Image.open(png_src))
    splash = png_img.resize((512, 512), Image.Resampling.LANCZOS)
    splash_path = BUILD / 'icon.png'
    splash.save(splash_path, format='PNG')
    print(f'  {png_src.relative_to(ROOT)} -> {splash_path.relative_to(ROOT)} (512x512)')

    # 桌面快捷方式 / exe / 任务栏：由 PNG 生成含 256 的 ICO
    # Windows .lnk 不能稳定引用 PNG，必须用 ICO 容器；256 档为 PNG 压缩，观感与原图一致
    desktop_ico = BUILD / 'icon.ico'
    png_img.save(desktop_ico, format='ICO', sizes=ICO_SIZES)
    print(f'  {png_src.relative_to(ROOT)} -> {desktop_ico.relative_to(ROOT)} (16..256 ICO，桌面/程序)')

    # 安装向导：用户提供的 ICO
    installer_ico = BUILD / 'installer.ico'
    copy_file(ico_src, installer_ico)

    if svg_src is not None:
        copy_file(svg_src, PUBLIC / 'icon.svg')

    print('完成。安装向导用 installer.ico，桌面/程序用由 PNG 生成的 icon.ico，界面用 icon.png。')
    return 0


if __name__ == '__main__':
    sys.exit(main())
