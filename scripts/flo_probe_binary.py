# -*- coding: utf-8 -*-
from __future__ import annotations

import json
import re
import struct
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class FloCompositionEntry:
    name: str
    value: str
    name_offset: int
    value_offset: int


@dataclass
class FloStreamBlock:
    name: str
    offset: int
    flow_t: str | None = None
    flow_s: str | None = None
    composition_kind: str | None = None
    composition: list[FloCompositionEntry] = field(default_factory=list)


def read_pascal_str(data: bytes, pos: int) -> tuple[str | None, int]:
    if pos >= len(data):
        return None, pos
    ln = data[pos]
    pos += 1
    if ln == 0:
        return "", pos
    if pos + ln > len(data):
        return None, pos
    try:
        return data[pos : pos + ln].decode("utf-8"), pos + ln
    except UnicodeDecodeError:
        return None, pos


def parse_stream_block(data: bytes, start: int) -> FloStreamBlock | None:
    pos = start
    dash, pos = read_pascal_str(data, pos)
    if dash != "-":
        return None
    name, pos = read_pascal_str(data, pos)
    if name is None or not name or not re.search(r"[\u4e00-\u9fffA-Za-z]", name):
        return None

    block = FloStreamBlock(name=name, offset=start)
    while pos < len(data):
        key, pos2 = read_pascal_str(data, pos)
        if key is None:
            break
        if key in ("W%", "E%"):
            block.composition_kind = key
            pos = pos2
            break
        if key in ("False", "True"):
            pos = pos2
            continue
        val, pos3 = read_pascal_str(data, pos2)
        if val is None:
            break
        if key == "t":
            block.flow_t = val
        elif key == "s":
            block.flow_s = val
        pos = pos3

    if not block.composition_kind:
        return None

    while pos < len(data) and data[pos] == 0:
        pos += 1
    if pos + 4 > len(data):
        return block
    entry_count = struct.unpack_from("<I", data, pos)[0]
    pos += 4
    if entry_count <= 0 or entry_count > 200:
        return block

    for _ in range(entry_count):
        while pos < len(data) and data[pos] == 0:
            pos += 1
        name_off = pos
        comp_name, pos = read_pascal_str(data, pos)
        if not comp_name or pos >= len(data) or data[pos] != 0:
            break
        pos += 1
        val_off = pos
        comp_val, pos = read_pascal_str(data, pos)
        if comp_val is None:
            break
        block.composition.append(
            FloCompositionEntry(comp_name, comp_val, name_off, val_off)
        )

    return block


def find_stream_blocks(data: bytes) -> list[FloStreamBlock]:
    blocks: list[FloStreamBlock] = []
    for i in range(len(data) - 8):
        if data[i] != 1 or data[i + 1] != 0x2D:
            continue
        block = parse_stream_block(data, i)
        if block and block.composition:
            blocks.append(block)
    return blocks


def main() -> None:
    data = Path(r"c:\Users\0303003\Desktop\西南铜(吴).flo").read_bytes()
    blocks = find_stream_blocks(data)
    keywords = ("\u7cbe\u77ff", "\u542b\u6c34", "\u6df7\u5408\u94dc\u7cbe\u77ff", "\u8fb9\u8d38")
    out = []
    for b in blocks:
        if not any(k in b.name for k in keywords):
            continue
        out.append(
            {
                "name": b.name,
                "offset": b.offset,
                "flow_t": b.flow_t,
                "flow_s": b.flow_s,
                "kind": b.composition_kind,
                "composition": {c.name: c.value for c in b.composition},
            }
        )
    path = Path(__file__).resolve().parent.parent / ".flo_streams.json"
    path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"blocks with composition: {len(blocks)}")
    for item in out:
        print(json.dumps(item, ensure_ascii=False)[:300])


if __name__ == "__main__":
    main()
