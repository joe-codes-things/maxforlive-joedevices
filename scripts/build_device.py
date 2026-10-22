#!/usr/bin/env python3
"""Create a new, incremented Max for Live device build."""

from __future__ import annotations

import argparse
import json
import os
import re
import struct
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEVICE_DIR = PROJECT_ROOT / "track-select-auto-arm"
DEVICE_NAME = "Track Select Auto Arm"
BUILD_FILE_PREFIX = "nla_Track-Select-Auto-Arm-v"
VERSIONED_FILE = re.compile(
    rf"^(?:{re.escape(BUILD_FILE_PREFIX)}|{re.escape(DEVICE_NAME)} v)"
    r"(?P<major>\d+)\.(?P<minor>\d+)\.(?P<patch>\d+)"
    r"\.(?P<extension>maxpat|amxd)$"
)
AMXD_HEADER = (
    b"ampf"
    + struct.pack("<I", 4)
    + b"aaaameta"
    + struct.pack("<I", 4)
    + b"\0" * 4
)


def package_amxd(patch_bytes: bytes) -> bytes:
    payload = patch_bytes.rstrip(b"\0") + b"\0"
    return AMXD_HEADER + b"ptch" + struct.pack("<I", len(payload)) + payload


def next_version(device_dir: Path) -> tuple[int, int, int, Path]:
    builds: list[tuple[tuple[int, int, int], Path]] = []
    versions: list[tuple[int, int, int]] = []
    for path in device_dir.rglob("*"):
        if not path.is_file():
            continue
        match = VERSIONED_FILE.fullmatch(path.name)
        if match:
            version = tuple(
                int(match.group(part)) for part in ("major", "minor", "patch")
            )
            versions.append(version)
            if match.group("extension") == "maxpat":
                builds.append((version, path))

    if not builds:
        raise FileNotFoundError(
            f"No versioned Max patch found in {device_dir}; "
            f"expected '{DEVICE_NAME} v<major>.<minor>.<patch>.maxpat'."
        )

    _, latest_source = max(builds, key=lambda build: build[0])
    major, minor, patch = max(versions)
    return major, minor, patch + 1, latest_source


def write_new_files(files: list[tuple[Path, bytes]]) -> None:
    created: list[Path] = []
    try:
        for path, content in files:
            descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o644)
            created.append(path)
            with os.fdopen(descriptor, "wb") as output:
                output.write(content)
    except Exception:
        for path in created:
            path.unlink(missing_ok=True)
        raise


def build_device(
    device_dir: Path = DEVICE_DIR, source_path: Path | None = None
) -> tuple[Path, Path]:
    major, minor, patch, latest_source = next_version(device_dir)
    if source_path is None:
        source_path = latest_source
    version = f"{major}.{minor}.{patch}"
    version_dir = device_dir / f"v{version}"
    build_filename = f"{BUILD_FILE_PREFIX}{version}"
    patch_path = version_dir / f"{build_filename}.maxpat"
    device_path = version_dir / f"{build_filename}.amxd"

    source = json.loads(source_path.read_text(encoding="utf-8"))
    patcher = source.get("patcher")
    if not isinstance(patcher, dict):
        raise ValueError(f"{source_path} does not contain a Max patcher object.")

    patcher["description"] = f"{DEVICE_NAME} v{version}"
    patch_bytes = json.dumps(source, indent=1, ensure_ascii=False).encode("utf-8")
    amxd_bytes = package_amxd(patch_bytes)
    version_dir.mkdir()
    try:
        write_new_files([(patch_path, patch_bytes), (device_path, amxd_bytes)])
    except Exception:
        version_dir.rmdir()
        raise
    return patch_path, device_path


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Build the next Track Select Auto Arm patch and AMXD, "
            "incrementing the patch version."
        )
    )
    parser.add_argument(
        "--source",
        type=Path,
        default=None,
        help="Use this patch file instead of the newest versioned patch.",
    )
    args = parser.parse_args()

    try:
        patch_path, device_path = build_device(source_path=args.source)
    except (FileExistsError, FileNotFoundError, json.JSONDecodeError, ValueError) as error:
        print(f"Build failed: {error}", file=sys.stderr)
        return 1

    print(f"Created {patch_path}")
    print(f"Created {device_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
