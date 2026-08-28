"""
Build-time script: convert LICENSE.txt (UTF-8) to LICENSE.nsis.txt (GBK).
NSIS on Chinese Windows displays the license using system codepage (GBK);
UTF-8 content would show as garbled. Run this before electron-builder.
"""
import os
import sys

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = os.path.join(root, 'LICENSE.txt')
out = os.path.join(root, 'LICENSE.nsis.txt')

if not os.path.isfile(src):
    print('LICENSE.txt not found:', src)
    sys.exit(1)

with open(src, 'r', encoding='utf-8') as f:
    content = f.read()


def license_text_for_gbk(s: str) -> str:
    """GBK 无法编码部分 Unicode 拉丁符号（如 ©）；先替换为可读 ASCII，便于 NSIS 显示。"""
    for old, new in (
        ('\u00a9', '(c)'),  # © COPYRIGHT SIGN → (c)
        ('\u00ae', '(R)'),  # ® REGISTERED SIGN
        ('\u2122', '(TM)'),  # ™ TRADE MARK SIGN
    ):
        s = s.replace(old, new)
    return s


content = license_text_for_gbk(content)

# GBK 仍可能遇到个别非标字符：用替换符兜底，避免构建脚本崩溃
with open(out, 'w', encoding='gbk', newline='\n', errors='replace') as f:
    f.write(content)

print('Created LICENSE.nsis.txt (GBK) for NSIS installer.')
