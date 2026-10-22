import json
import struct
import tempfile
import unittest
from pathlib import Path

from scripts.build_device import (
    DEFAULT_DEVICE_DIR,
    PROJECT_ROOT,
    build_device,
    write_new_files,
)


class BuildDeviceTests(unittest.TestCase):
    def test_default_device_dir_uses_devices_folder(self) -> None:
        self.assertEqual(
            DEFAULT_DEVICE_DIR.relative_to(PROJECT_ROOT),
            Path("devices/track-select-auto-arm"),
        )

    @staticmethod
    def create_device(
        device_dir: Path,
        name: str = "Track Select Auto Arm",
        build_prefix: str = "nla_Track-Select-Auto-Arm-v",
    ) -> Path:
        device_dir.mkdir(parents=True, exist_ok=True)
        (device_dir / "device.json").write_text(
            json.dumps({"name": name, "build_prefix": build_prefix}),
            encoding="utf-8",
        )
        return device_dir

    def test_builds_incrementing_versions_without_overwriting(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            device_dir = self.create_device(Path(temporary_directory))
            source_dir = device_dir / "v0.0.1"
            source_dir.mkdir()
            source = source_dir / "Track Select Auto Arm v0.0.1.maxpat"
            source.write_text(
                json.dumps({"patcher": {"description": "initial"}}),
                encoding="utf-8",
            )

            first_patch, first_device = build_device(device_dir)
            second_patch, second_device = build_device(device_dir)

            self.assertEqual(first_patch.parent.name, "v0.0.2")
            self.assertEqual(first_device.parent.name, "v0.0.2")
            self.assertEqual(
                first_patch.name, "nla_Track-Select-Auto-Arm-v0.0.2.maxpat"
            )
            self.assertEqual(
                first_device.name, "nla_Track-Select-Auto-Arm-v0.0.2.amxd"
            )
            self.assertEqual(second_patch.parent.name, "v0.0.3")
            self.assertEqual(second_device.parent.name, "v0.0.3")
            self.assertEqual(
                second_patch.name, "nla_Track-Select-Auto-Arm-v0.0.3.maxpat"
            )
            self.assertEqual(
                second_device.name, "nla_Track-Select-Auto-Arm-v0.0.3.amxd"
            )
            self.assertTrue(first_patch.exists())
            self.assertTrue(first_device.exists())

            patch_data = json.loads(second_patch.read_text(encoding="utf-8"))
            self.assertEqual(
                patch_data["patcher"]["description"], "Track Select Auto Arm v0.0.3"
            )

            package = second_device.read_bytes()
            self.assertEqual(package[24:28], b"ptch")
            payload_length = struct.unpack("<I", package[28:32])[0]
            embedded_patch = json.loads(package[32 : 32 + payload_length].rstrip(b"\0"))
            self.assertEqual(embedded_patch, patch_data)

    def test_orphaned_device_version_is_not_overwritten(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            device_dir = self.create_device(Path(temporary_directory))
            source_dir = device_dir / "v0.0.1"
            source_dir.mkdir()
            source = source_dir / "Track Select Auto Arm v0.0.1.maxpat"
            source.write_text(json.dumps({"patcher": {}}), encoding="utf-8")
            existing_dir = device_dir / "v0.0.2"
            existing_dir.mkdir()
            existing_device = existing_dir / "Track Select Auto Arm v0.0.2.amxd"
            existing_device.write_bytes(b"preserve")

            patch_path, device_path = build_device(device_dir)

            self.assertEqual(patch_path.parent.name, "v0.0.3")
            self.assertEqual(device_path.parent.name, "v0.0.3")
            self.assertEqual(
                patch_path.name, "nla_Track-Select-Auto-Arm-v0.0.3.maxpat"
            )
            self.assertEqual(
                device_path.name, "nla_Track-Select-Auto-Arm-v0.0.3.amxd"
            )
            self.assertEqual(existing_device.read_bytes(), b"preserve")

    def test_explicit_source_can_build_a_new_version(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            device_dir = self.create_device(root / "device")
            source_dir = device_dir / "v0.0.1"
            source_dir.mkdir()
            source = source_dir / "Track Select Auto Arm v0.0.1.maxpat"
            source.write_text(
                json.dumps({"patcher": {"description": "old"}}), encoding="utf-8"
            )
            edited_source = root / "corrected.maxpat"
            edited_source.write_text(
                json.dumps({"patcher": {"description": "fixed"}}), encoding="utf-8"
            )

            patch_path, _ = build_device(device_dir, source_path=edited_source)

            self.assertEqual(patch_path.parent.name, "v0.0.2")
            self.assertEqual(
                patch_path.name, "nla_Track-Select-Auto-Arm-v0.0.2.maxpat"
            )
            patch_data = json.loads(patch_path.read_text(encoding="utf-8"))
            self.assertEqual(
                patch_data["patcher"]["description"], "Track Select Auto Arm v0.0.2"
            )

    def test_failed_pair_creation_rolls_back_new_file(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            directory = Path(temporary_directory)
            existing_file = directory / "existing.amxd"
            existing_file.write_bytes(b"preserve")
            new_file = directory / "new.maxpat"

            with self.assertRaises(FileExistsError):
                write_new_files([(new_file, b"new"), (existing_file, b"overwrite")])

            self.assertFalse(new_file.exists())
            self.assertEqual(existing_file.read_bytes(), b"preserve")

    def test_legacy_flat_build_is_discovered_and_new_build_is_foldered(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            device_dir = self.create_device(Path(temporary_directory))
            legacy_source = device_dir / "Track Select Auto Arm v0.0.1.maxpat"
            legacy_source.write_text(json.dumps({"patcher": {}}), encoding="utf-8")

            patch_path, device_path = build_device(device_dir)

            self.assertEqual(patch_path.parent.name, "v0.0.2")
            self.assertEqual(device_path.parent.name, "v0.0.2")
            self.assertEqual(
                device_path.name, "nla_Track-Select-Auto-Arm-v0.0.2.amxd"
            )

    def test_new_device_can_build_first_version_from_root_source(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            device_dir = self.create_device(
                Path(temporary_directory),
                name="New Device",
                build_prefix="nla_New-Device-v",
            )
            (device_dir / "New Device.maxpat").write_text(
                json.dumps({"patcher": {}}), encoding="utf-8"
            )

            patch_path, device_path = build_device(device_dir)

            self.assertEqual(patch_path.parent.name, "v0.0.1")
            self.assertEqual(patch_path.name, "nla_New-Device-v0.0.1.maxpat")
            self.assertEqual(device_path.name, "nla_New-Device-v0.0.1.amxd")
            patch_data = json.loads(patch_path.read_text(encoding="utf-8"))
            self.assertEqual(patch_data["patcher"]["description"], "New Device v0.0.1")

    def test_device_versions_are_independent(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            arm_dir = self.create_device(root / "devices" / "track-select-auto-arm")
            arm_source_dir = arm_dir / "v0.0.3"
            arm_source_dir.mkdir()
            (arm_source_dir / "Track Select Auto Arm v0.0.3.maxpat").write_text(
                json.dumps({"patcher": {}}), encoding="utf-8"
            )

            other_dir = self.create_device(
                root / "other-device",
                name="Other Device",
                build_prefix="nla_Other-Device-v",
            )
            other_source_dir = other_dir / "v1.2.4"
            other_source_dir.mkdir()
            (other_source_dir / "nla_Other-Device-v1.2.4.maxpat").write_text(
                json.dumps({"patcher": {}}), encoding="utf-8"
            )

            arm_build, _ = build_device(arm_dir)
            other_build, _ = build_device(other_dir)

            self.assertEqual(arm_build.parent.name, "v0.0.4")
            self.assertEqual(other_build.parent.name, "v1.2.5")

    def test_device_manifest_requires_name_and_build_prefix(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            device_dir = Path(temporary_directory)
            (device_dir / "device.json").write_text(
                '{"name":"Missing prefix"}', encoding="utf-8"
            )

            with self.assertRaisesRegex(ValueError, "build_prefix"):
                build_device(device_dir)

    def test_manifest_requires_nla_versioned_filename_prefix(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            device_dir = self.create_device(
                Path(temporary_directory), build_prefix="Other-Device-"
            )
            (device_dir / "Other Device.maxpat").write_text(
                json.dumps({"patcher": {}}), encoding="utf-8"
            )

            with self.assertRaisesRegex(ValueError, "nla_<Device-Name>-v"):
                build_device(device_dir)

    def test_v003_routes_live_api_responses_and_defers_query(self) -> None:
        patch_path = (
            DEFAULT_DEVICE_DIR / "v0.0.3" / "Track Select Auto Arm v0.0.3.maxpat"
        )
        patch = json.loads(patch_path.read_text(encoding="utf-8"))["patcher"]
        boxes = {box["box"]["id"]: box["box"].get("text") for box in patch["boxes"]}
        connections = {
            (
                tuple(line["patchline"]["source"]),
                tuple(line["patchline"]["destination"]),
            )
            for line in patch["lines"]
        }

        self.assertEqual(boxes["obj-22"], "deferlow")
        self.assertEqual(boxes["obj-23"], "route can_be_armed")
        self.assertEqual(boxes["obj-24"], "route arm")
        self.assertIn((("obj-10", 0), ("obj-22", 0)), connections)
        self.assertIn((("obj-22", 0), ("obj-12", 0)), connections)
        self.assertIn((("obj-11", 0), ("obj-23", 0)), connections)
        self.assertIn((("obj-23", 0), ("obj-13", 0)), connections)
        self.assertIn((("obj-23", 1), ("obj-13", 0)), connections)
        self.assertIn((("obj-21", 0), ("obj-24", 0)), connections)
        self.assertIn((("obj-24", 0), ("obj-15", 0)), connections)
        self.assertIn((("obj-24", 1), ("obj-15", 0)), connections)


if __name__ == "__main__":
    unittest.main()
