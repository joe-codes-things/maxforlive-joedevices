#!/usr/bin/env python3
"""Create a new, incremented Max for Live device build."""

from __future__ import annotations

import argparse
import json
import os
import re
import struct
import sys
from dataclasses import dataclass
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DEVICE_DIR = PROJECT_ROOT / "devices" / "track-select-auto-arm"
DEVICE_CONFIG = "device.json"
VERSION_PATTERN = r"(?P<major>\d+)\.(?P<minor>\d+)\.(?P<patch>\d+)"
AMXD_HEADER = (
    b"ampf"
    + struct.pack("<I", 4)
    + b"aaaameta"
    + struct.pack("<I", 4)
    + b"\0" * 4
)


@dataclass(frozen=True)
class DeviceConfig:
    name: str
    build_prefix: str


def load_device_config(device_dir: Path) -> DeviceConfig:
    config_path = device_dir / DEVICE_CONFIG
    config_data = json.loads(config_path.read_text(encoding="utf-8"))
    if not isinstance(config_data, dict):
        raise ValueError(f"{config_path} must contain a JSON object.")

    name = config_data.get("name")
    build_prefix = config_data.get("build_prefix")
    if not isinstance(name, str) or not name.strip():
        raise ValueError(f"{config_path} must define a non-empty 'name'.")
    if not isinstance(build_prefix, str) or not build_prefix.strip():
        raise ValueError(f"{config_path} must define a non-empty 'build_prefix'.")
    if Path(build_prefix).name != build_prefix:
        raise ValueError(f"{config_path} 'build_prefix' must be a filename prefix.")
    if not build_prefix.startswith("nla_") or not build_prefix.endswith("-v"):
        raise ValueError(
            f"{config_path} 'build_prefix' must follow the "
            "'nla_<Device-Name>-v' convention."
        )

    return DeviceConfig(name=name, build_prefix=build_prefix)


def package_amxd(patch_bytes: bytes) -> bytes:
    payload = patch_bytes.rstrip(b"\0") + b"\0"
    return AMXD_HEADER + b"ptch" + struct.pack("<I", len(payload)) + payload


def versioned_file_pattern(config: DeviceConfig) -> re.Pattern[str]:
    legacy_prefix = f"{config.name} v"
    prefixes = {config.build_prefix, legacy_prefix}
    return re.compile(
        rf"^(?:{'|'.join(re.escape(prefix) for prefix in prefixes)})"
        rf"{VERSION_PATTERN}\.(?P<extension>maxpat|amxd)$"
    )


def initial_source(device_dir: Path, source_path: Path | None) -> Path:
    if source_path is not None:
        return source_path

    sources = sorted(device_dir.glob("*.maxpat"))
    if len(sources) != 1:
        raise FileNotFoundError(
            f"No versioned build found in {device_dir}. Add exactly one initial "
            f"Max patch source at the device-folder root, or pass --source."
        )
    return sources[0]


def next_version(
    device_dir: Path,
    config: DeviceConfig,
    source_path: Path | None = None,
) -> tuple[int, int, int, Path]:
    builds: list[tuple[tuple[int, int, int], Path]] = []
    versions: list[tuple[int, int, int]] = []
    pattern = versioned_file_pattern(config)
    for path in device_dir.rglob("*"):
        if not path.is_file():
            continue
        match = pattern.fullmatch(path.name)
        if match:
            version = tuple(
                int(match.group(part)) for part in ("major", "minor", "patch")
            )
            versions.append(version)
            if match.group("extension") == "maxpat":
                builds.append((version, path))

    if not builds:
        if versions:
            raise FileNotFoundError(
                f"No versioned Max patch found in {device_dir}; "
                "a matching AMXD exists without its source patch."
            )
        return 0, 0, 1, initial_source(device_dir, source_path)

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
    device_dir: Path,
    source_path: Path | None = None,
) -> tuple[Path, Path]:
    config = load_device_config(device_dir)
    major, minor, patch, latest_source = next_version(
        device_dir, config, source_path
    )
    if source_path is None:
        source_path = latest_source
    version = f"{major}.{minor}.{patch}"
    version_dir = device_dir / f"v{version}"
    build_filename = f"{config.build_prefix}{version}"
    patch_path = version_dir / f"{build_filename}.maxpat"
    device_path = version_dir / f"{build_filename}.amxd"

    source = json.loads(source_path.read_text(encoding="utf-8"))
    patcher = source.get("patcher") if isinstance(source, dict) else None
    if not isinstance(patcher, dict):
        raise ValueError(f"{source_path} does not contain a Max patcher object.")

    patcher["description"] = f"{config.name} v{version}"
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
        description="Build the next version of a Max for Live device."
    )
    parser.add_argument(
        "device_dir",
        nargs="?",
        type=Path,
        default=DEFAULT_DEVICE_DIR,
        help=(
            "Device folder containing device.json "
            "(default: devices/track-select-auto-arm)."
        ),
    )
    parser.add_argument(
        "--source",
        type=Path,
        default=None,
        help="Use this patch instead of the latest versioned source.",
    )
    args = parser.parse_args()

    try:
        patch_path, device_path = build_device(args.device_dir, args.source)
    except (
        FileExistsError,
        FileNotFoundError,
        json.JSONDecodeError,
        OSError,
        ValueError,
    ) as error:
        print(f"Build failed: {error}", file=sys.stderr)
        return 1

    print(f"Created {patch_path}")
    print(f"Created {device_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
