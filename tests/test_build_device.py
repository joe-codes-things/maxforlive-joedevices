import json
import struct
import tempfile
import unittest
from pathlib import Path

from scripts.build_device import DEVICE_DIR, build_device, write_new_files


class BuildDeviceTests(unittest.TestCase):
    def test_builds_incrementing_versions_without_overwriting(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            device_dir = Path(temporary_directory)
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
            self.assertEqual(first_patch.name, "nla_Track-Select-Auto-Arm-v0.0.2.maxpat")
            self.assertEqual(first_device.name, "nla_Track-Select-Auto-Arm-v0.0.2.amxd")
            self.assertEqual(second_patch.parent.name, "v0.0.3")
            self.assertEqual(second_device.parent.name, "v0.0.3")
            self.assertEqual(second_patch.name, "nla_Track-Select-Auto-Arm-v0.0.3.maxpat")
            self.assertEqual(second_device.name, "nla_Track-Select-Auto-Arm-v0.0.3.amxd")
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
            device_dir = Path(temporary_directory)
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
            self.assertEqual(patch_path.name, "nla_Track-Select-Auto-Arm-v0.0.3.maxpat")
            self.assertEqual(device_path.name, "nla_Track-Select-Auto-Arm-v0.0.3.amxd")
            self.assertEqual(existing_device.read_bytes(), b"preserve")

    def test_explicit_source_can_build_a_new_version(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            device_dir = root / "device"
            device_dir.mkdir()
            source_dir = device_dir / "v0.0.1"
            source_dir.mkdir()
            source = source_dir / "Track Select Auto Arm v0.0.1.maxpat"
            source.write_text(json.dumps({"patcher": {"description": "old"}}))
            edited_source = root / "corrected.maxpat"
            edited_source.write_text(json.dumps({"patcher": {"description": "fixed"}}))

            patch_path, _ = build_device(device_dir, source_path=edited_source)

            self.assertEqual(patch_path.parent.name, "v0.0.2")
            self.assertEqual(patch_path.name, "nla_Track-Select-Auto-Arm-v0.0.2.maxpat")
            patch_data = json.loads(patch_path.read_text())
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
            device_dir = Path(temporary_directory)
            legacy_source = device_dir / "Track Select Auto Arm v0.0.1.maxpat"
            legacy_source.write_text(json.dumps({"patcher": {}}), encoding="utf-8")

            patch_path, device_path = build_device(device_dir)

            self.assertEqual(patch_path.parent.name, "v0.0.2")
            self.assertEqual(device_path.parent.name, "v0.0.2")
            self.assertEqual(device_path.name, "nla_Track-Select-Auto-Arm-v0.0.2.amxd")

    def test_v003_routes_live_api_responses_and_defers_query(self) -> None:
        patch_path = (
            DEVICE_DIR / "v0.0.3" / "Track Select Auto Arm v0.0.3.maxpat"
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
