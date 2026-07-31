#!/usr/bin/env python3
"""Extract a zip safely into a destination directory (reject Zip Slip paths).

Used by vrt-report.mjs inside the Playwright container, which has python3 but
not the zip/unzip CLIs. Members with absolute paths or '..' segments are
rejected before any file is written.
"""
from __future__ import annotations

import os
import sys
import zipfile


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: vrt-unzip.py <zip> <dest>", file=sys.stderr)
        return 2
    src, dest = sys.argv[1], sys.argv[2]
    dest_real = os.path.realpath(dest)
    os.makedirs(dest_real, exist_ok=True)
    with zipfile.ZipFile(src) as zf:
        for name in zf.namelist():
            norm = name.replace("\\", "/")
            if norm.startswith("/") or any(part == ".." for part in norm.split("/")):
                print(f"unsafe zip member: {name}", file=sys.stderr)
                return 1
            target = os.path.realpath(os.path.join(dest_real, name))
            if target != dest_real and not target.startswith(dest_real + os.sep):
                print(f"unsafe zip member: {name}", file=sys.stderr)
                return 1
        zf.extractall(dest_real)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
