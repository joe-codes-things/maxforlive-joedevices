import json
import re
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

    def test_build_copies_javascript_dependency_beside_device(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            device_dir = self.create_device(Path(temporary_directory))
            source = device_dir / "Track Select Auto Arm.maxpat"
            source.write_text(
                json.dumps(
                    {
                        "patcher": {
                            "boxes": [
                                {"box": {"text": "js helper.js"}},
                            ]
                        }
                    }
                ),
                encoding="utf-8",
            )
            dependency = device_dir / "helper.js"
            dependency.write_text("function bang() {}", encoding="utf-8")

            patch_path, _ = build_device(device_dir)

            self.assertEqual(
                (patch_path.parent / "helper.js").read_text(encoding="utf-8"),
                "function bang() {}",
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

    def test_q_for_quantize_build_packages_live_api_script(self) -> None:
        source_dir = PROJECT_ROOT / "devices" / "q-for-quantize"
        with tempfile.TemporaryDirectory() as temporary_directory:
            device_dir = self.create_device(
                Path(temporary_directory),
                name="Q for Quantize",
                build_prefix="nla_Q-For-Quantize-v",
            )
            (device_dir / "Q for Quantize.maxpat").write_bytes(
                (source_dir / "Q for Quantize.maxpat").read_bytes()
            )
            (device_dir / "q_for_quantize.js").write_bytes(
                (source_dir / "q_for_quantize.js").read_bytes()
            )

            patch_path, device_path = build_device(device_dir)

            self.assertEqual(patch_path.parent.name, "v0.0.1")
            self.assertEqual(
                patch_path.name, "nla_Q-For-Quantize-v0.0.1.maxpat"
            )
            self.assertEqual(
                device_path.name, "nla_Q-For-Quantize-v0.0.1.amxd"
            )
            packaged_script = patch_path.parent / "q_for_quantize.js"
            self.assertEqual(
                packaged_script.read_bytes(),
                (source_dir / "q_for_quantize.js").read_bytes(),
            )

    def test_show_vst_instrument_build_packages_live_api_script(self) -> None:
        source_dir = PROJECT_ROOT / "devices" / "show-vst-instrument"
        with tempfile.TemporaryDirectory() as temporary_directory:
            device_dir = self.create_device(
                Path(temporary_directory),
                name="Show VST Instrument",
                build_prefix="nla_Show-VST-Instrument-v",
            )
            (device_dir / "Show VST Instrument.maxpat").write_bytes(
                (source_dir / "Show VST Instrument.maxpat").read_bytes()
            )
            (device_dir / "show_vst_instrument.js").write_bytes(
                (source_dir / "show_vst_instrument.js").read_bytes()
            )

            patch_path, device_path = build_device(device_dir)

            self.assertEqual(patch_path.parent.name, "v0.0.1")
            self.assertEqual(
                patch_path.name, "nla_Show-VST-Instrument-v0.0.1.maxpat"
            )
            self.assertEqual(
                device_path.name, "nla_Show-VST-Instrument-v0.0.1.amxd"
            )
            self.assertEqual(
                (patch_path.parent / "show_vst_instrument.js").read_bytes(),
                (source_dir / "show_vst_instrument.js").read_bytes(),
            )

    def test_show_device_view_build_packages_live_api_script(self) -> None:
        source_dir = PROJECT_ROOT / "devices" / "show-device-view"
        with tempfile.TemporaryDirectory() as temporary_directory:
            device_dir = self.create_device(
                Path(temporary_directory),
                name="Show Device View",
                build_prefix="nla_Show-Device-View-v",
            )
            (device_dir / "Show Device View.maxpat").write_bytes(
                (source_dir / "Show Device View.maxpat").read_bytes()
            )
            (device_dir / "show_device_view.js").write_bytes(
                (source_dir / "show_device_view.js").read_bytes()
            )

            patch_path, device_path = build_device(device_dir)

            self.assertEqual(patch_path.parent.name, "v0.0.1")
            self.assertEqual(
                patch_path.name, "nla_Show-Device-View-v0.0.1.maxpat"
            )
            self.assertEqual(
                device_path.name, "nla_Show-Device-View-v0.0.1.amxd"
            )
            self.assertEqual(
                (patch_path.parent / "show_device_view.js").read_bytes(),
                (source_dir / "show_device_view.js").read_bytes(),
            )
            patch_data = json.loads(patch_path.read_text(encoding="utf-8"))
            self.assertTrue(
                any(
                    "lowercase x" in entry["box"].get("text", "")
                    for entry in patch_data["patcher"]["boxes"]
                )
            )

    def test_back_to_start_build_packages_live_api_script(self) -> None:
        source_dir = PROJECT_ROOT / "devices" / "back-to-start"
        with tempfile.TemporaryDirectory() as temporary_directory:
            device_dir = self.create_device(
                Path(temporary_directory),
                name="Back to Start",
                build_prefix="nla_Back-To-Start-v",
            )
            (device_dir / "Back to Start.maxpat").write_bytes(
                (source_dir / "Back to Start.maxpat").read_bytes()
            )
            (device_dir / "back_to_start.js").write_bytes(
                (source_dir / "back_to_start.js").read_bytes()
            )

            patch_path, device_path = build_device(device_dir)

            self.assertEqual(patch_path.parent.name, "v0.0.1")
            self.assertEqual(
                patch_path.name, "nla_Back-To-Start-v0.0.1.maxpat"
            )
            self.assertEqual(
                device_path.name, "nla_Back-To-Start-v0.0.1.amxd"
            )
            self.assertEqual(
                (patch_path.parent / "back_to_start.js").read_bytes(),
                (source_dir / "back_to_start.js").read_bytes(),
            )
            patch_data = json.loads(patch_path.read_text(encoding="utf-8"))
            ui_text = "\n".join(
                entry["box"].get("text", "")
                for entry in patch_data["patcher"]["boxes"]
            )
            self.assertIn("Scrub Area", ui_text)
            self.assertIn("Play Start Indicator", ui_text)
            self.assertTrue(
                any(
                    "Num Pad 0" in entry["box"].get("text", "")
                    for entry in patch_data["patcher"]["boxes"]
                )
            )

    def test_single_bar_jump_build_packages_live_api_script(self) -> None:
        source_dir = PROJECT_ROOT / "devices" / "single-bar-jump"
        with tempfile.TemporaryDirectory() as temporary_directory:
            device_dir = self.create_device(
                Path(temporary_directory),
                name="Single Bar Jump",
                build_prefix="nla_Single-Bar-Jump-v",
            )
            (device_dir / "Single Bar Jump.maxpat").write_bytes(
                (source_dir / "Single Bar Jump.maxpat").read_bytes()
            )
            (device_dir / "single_bar_jump.js").write_bytes(
                (source_dir / "single_bar_jump.js").read_bytes()
            )

            patch_path, device_path = build_device(device_dir)

            self.assertEqual(patch_path.parent.name, "v0.0.1")
            self.assertEqual(
                patch_path.name, "nla_Single-Bar-Jump-v0.0.1.maxpat"
            )
            self.assertEqual(
                device_path.name, "nla_Single-Bar-Jump-v0.0.1.amxd"
            )
            self.assertEqual(
                (patch_path.parent / "single_bar_jump.js").read_bytes(),
                (source_dir / "single_bar_jump.js").read_bytes(),
            )
            patch_data = json.loads(patch_path.read_text(encoding="utf-8"))
            patcher = patch_data["patcher"]
            boxes = {
                entry["box"]["id"]: entry["box"] for entry in patcher["boxes"]
            }
            self.assertEqual(boxes["obj-5"]["maxclass"], "live.button")
            self.assertEqual(boxes["obj-9"]["maxclass"], "live.button")
            self.assertIn("comma (,)", boxes["obj-2"]["text"])
            self.assertIn("period (.)", boxes["obj-2"]["text"])
            self.assertEqual(boxes["obj-6"]["text"], "t b")
            self.assertEqual(boxes["obj-10"]["text"], "t b")
            self.assertEqual(boxes["obj-5"]["transition"], 2)
            self.assertEqual(boxes["obj-9"]["transition"], 2)
            self.assertEqual(boxes["obj-5"]["mode"], 0)
            self.assertEqual(boxes["obj-9"]["mode"], 0)
            connections = {
                (
                    tuple(line["patchline"]["source"]),
                    tuple(line["patchline"]["destination"]),
                )
                for line in patcher["lines"]
            }
            self.assertIn((("obj-5", 0), ("obj-6", 0)), connections)
            self.assertIn((("obj-6", 0), ("obj-7", 0)), connections)
            self.assertIn((("obj-9", 0), ("obj-10", 0)), connections)
            self.assertIn((("obj-10", 0), ("obj-11", 0)), connections)
            self.assertIn((("obj-7", 0), ("obj-12", 0)), connections)
            self.assertIn((("obj-11", 0), ("obj-12", 0)), connections)
            self.assertIn((("obj-12", 0), ("obj-13", 0)), connections)
            script = (source_dir / "single_bar_jump.js").read_text(encoding="utf-8")
            self.assertIn("signature_numerator", script)
            self.assertIn('song.call("jump_by", currentJump)', script)
            self.assertIn("Single-Bar-Jump ERROR:", script)
            self.assertIn("script loaded; Back and Forward controls ready", script)

    def test_locators_device_build_packages_controls_and_diagnostics(self) -> None:
        source_dir = PROJECT_ROOT / "devices" / "locators-markers-create-navigate"
        with tempfile.TemporaryDirectory() as temporary_directory:
            device_dir = self.create_device(
                Path(temporary_directory),
                name="Locators (Markers) Create Navigate",
                build_prefix="nla_Locators-Markers-Create-Navigate-v",
            )
            (device_dir / "Locators (Markers) Create Navigate.maxpat").write_bytes(
                (source_dir / "Locators (Markers) Create Navigate.maxpat").read_bytes()
            )
            script_source = source_dir / "locators_markers_create_navigate.js"
            (device_dir / script_source.name).write_bytes(script_source.read_bytes())

            patch_path, device_path = build_device(device_dir)

            self.assertEqual(patch_path.parent.name, "v0.0.1")
            self.assertEqual(
                patch_path.name,
                "nla_Locators-Markers-Create-Navigate-v0.0.1.maxpat",
            )
            self.assertEqual(
                device_path.name,
                "nla_Locators-Markers-Create-Navigate-v0.0.1.amxd",
            )
            self.assertEqual(
                (patch_path.parent / script_source.name).read_bytes(),
                script_source.read_bytes(),
            )

            patch_data = json.loads(patch_path.read_text(encoding="utf-8"))
            patcher = patch_data["patcher"]
            boxes = {
                entry["box"]["id"]: entry["box"] for entry in patcher["boxes"]
            }
            self.assertIn("Set/Delete to `", boxes["obj-2"]["text"])
            self.assertIn("Num Pad 7", boxes["obj-2"]["text"])
            self.assertIn("Num Pad 9", boxes["obj-2"]["text"])
            self.assertIn("without starting playback", boxes["obj-3"]["text"])
            for button_id in ("obj-5", "obj-9", "obj-13"):
                self.assertEqual(boxes[button_id]["maxclass"], "live.button")
                self.assertEqual(boxes[button_id]["transition"], 2)
                self.assertEqual(boxes[button_id]["mode"], 0)
            self.assertEqual(boxes["obj-7"]["text"], "0")
            self.assertEqual(boxes["obj-11"]["text"], "-1")
            self.assertEqual(boxes["obj-15"]["text"], "1")
            connections = {
                (
                    tuple(line["patchline"]["source"]),
                    tuple(line["patchline"]["destination"]),
                )
                for line in patcher["lines"]
            }
            self.assertIn((("obj-5", 0), ("obj-6", 0)), connections)
            self.assertIn((("obj-7", 0), ("obj-16", 0)), connections)
            self.assertIn((("obj-9", 0), ("obj-10", 0)), connections)
            self.assertIn((("obj-11", 0), ("obj-16", 0)), connections)
            self.assertIn((("obj-13", 0), ("obj-14", 0)), connections)
            self.assertIn((("obj-15", 0), ("obj-16", 0)), connections)
            self.assertIn((("obj-16", 0), ("obj-17", 0)), connections)

            script = script_source.read_text(encoding="utf-8")
            self.assertIn('song.call("set_or_delete_cue")', script)
            self.assertIn('song.getcount("cue_points")', script)
            self.assertIn('song.set("current_song_time", targetPosition)', script)
            self.assertIn("Transport state changed unexpectedly", script)
            self.assertIn("Locators-Markers-Create-Navigate ERROR:", script)

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

    def test_m_for_mute_v0_0_1_toggles_selected_track_mute(self) -> None:
        patch_path = (
            PROJECT_ROOT
            / "devices"
            / "m-for-mute"
            / "v0.0.1"
            / "nla_M-For-Mute-v0.0.1.maxpat"
        )
        patch_data = json.loads(patch_path.read_text(encoding="utf-8"))
        patcher = patch_data["patcher"]
        boxes = {entry["box"]["id"]: entry["box"] for entry in patcher["boxes"]}
        connections = {
            (
                tuple(line["patchline"]["source"]),
                tuple(line["patchline"]["destination"]),
            )
            for line in patcher["lines"]
        }

        self.assertEqual(boxes["obj-1"]["text"], "M for Mute")
        self.assertEqual(
            boxes["obj-2"]["text"],
            "Map Mute to lowercase m in Key Map Mode. Turn off Musical Typing first.",
        )
        self.assertEqual(boxes["obj-3"]["maxclass"], "live.button")
        self.assertEqual(boxes["obj-3"]["mode"], 1)
        self.assertEqual(
            boxes["obj-3"]["saved_attribute_attributes"]["valueof"][
                "parameter_shortname"
            ],
            "Mute",
        )
        self.assertEqual(boxes["obj-10"]["text"], "live.path live_set view")
        self.assertEqual(boxes["obj-12"]["text"], "property selected_track")
        self.assertEqual(boxes["obj-13"]["text"], "live.observer")
        self.assertEqual(boxes["obj-15"]["text"], "get mute")
        self.assertEqual(boxes["obj-17"]["text"], "route mute")
        self.assertEqual(boxes["obj-18"]["text"], "!- 1")
        self.assertEqual(boxes["obj-19"]["text"], "prepend set mute")
        self.assertIn((("obj-3", 0), ("obj-16", 0)), connections)
        self.assertIn((("obj-16", 0), ("obj-15", 0)), connections)
        self.assertIn((("obj-15", 0), ("obj-14", 0)), connections)
        self.assertIn((("obj-17", 0), ("obj-18", 0)), connections)
        self.assertIn((("obj-18", 0), ("obj-19", 0)), connections)
        self.assertIn((("obj-19", 0), ("obj-24", 0)), connections)
        self.assertIn((("obj-13", 0), ("obj-14", 1)), connections)
        self.assertIn((("obj-13", 0), ("obj-24", 1)), connections)

        package = (
            PROJECT_ROOT
            / "devices"
            / "m-for-mute"
            / "v0.0.1"
            / "nla_M-For-Mute-v0.0.1.amxd"
        ).read_bytes()
        self.assertEqual(package[24:28], b"ptch")
        payload_length = struct.unpack("<I", package[28:32])[0]
        embedded_patch = json.loads(package[32 : 32 + payload_length].rstrip(b"\0"))
        self.assertEqual(embedded_patch, patch_data)

    def test_m_for_mute_v0_0_2_toggles_each_selected_track(self) -> None:
        patch_path = (
            PROJECT_ROOT
            / "devices"
            / "m-for-mute"
            / "v0.0.2"
            / "nla_M-For-Mute-v0.0.2.maxpat"
        )
        patch_data = json.loads(patch_path.read_text(encoding="utf-8"))
        patcher = patch_data["patcher"]
        boxes = {entry["box"]["id"]: entry["box"] for entry in patcher["boxes"]}
        connections = {
            (
                tuple(line["patchline"]["source"]),
                tuple(line["patchline"]["destination"]),
            )
            for line in patcher["lines"]
        }

        self.assertEqual(boxes["obj-2"]["text"], (
            "Map Mute to lowercase m. Toggles each selected track's activator."
        ))
        self.assertEqual(boxes["obj-12"]["text"], "getchild tracks")
        self.assertEqual(boxes["obj-29"]["text"], "getchild return_tracks")
        self.assertEqual(
            boxes["obj-14"]["text"], "route tracks return_tracks"
        )
        self.assertEqual(boxes["obj-14"]["numoutlets"], 3)
        self.assertEqual(boxes["obj-15"]["text"], "zl iter 2")
        self.assertEqual(boxes["obj-17"]["text"], "route is_part_of_selection")
        self.assertEqual(boxes["obj-18"]["text"], "sel 1")
        self.assertEqual(boxes["obj-19"]["text"], "get mute")
        self.assertEqual(boxes["obj-26"]["text"], "route mute")
        self.assertEqual(boxes["obj-27"]["text"], "!- 1")
        self.assertEqual(boxes["obj-28"]["text"], "prepend set mute")
        self.assertIn((("obj-15", 0), ("obj-11", 0)), connections)
        self.assertIn((("obj-11", 1), ("obj-24", 1)), connections)
        self.assertIn((("obj-25", 0), ("obj-24", 0)), connections)
        self.assertIn((("obj-24", 0), ("obj-17", 0)), connections)
        self.assertIn((("obj-19", 0), ("obj-24", 0)), connections)
        self.assertIn((("obj-28", 0), ("obj-24", 0)), connections)

        package = (
            PROJECT_ROOT
            / "devices"
            / "m-for-mute"
            / "v0.0.2"
            / "nla_M-For-Mute-v0.0.2.amxd"
        ).read_bytes()
        self.assertEqual(package[24:28], b"ptch")
        payload_length = struct.unpack("<I", package[28:32])[0]
        embedded_patch = json.loads(package[32 : 32 + payload_length].rstrip(b"\0"))
        self.assertEqual(embedded_patch, patch_data)

    def test_m_for_mute_v0_0_3_reports_diagnostic_stages(self) -> None:
        patch_path = (
            PROJECT_ROOT
            / "devices"
            / "m-for-mute"
            / "v0.0.3"
            / "nla_M-For-Mute-v0.0.3.maxpat"
        )
        patch_data = json.loads(patch_path.read_text(encoding="utf-8"))
        patcher = patch_data["patcher"]
        boxes = {entry["box"]["id"]: entry["box"] for entry in patcher["boxes"]}
        connections = {
            (
                tuple(line["patchline"]["source"]),
                tuple(line["patchline"]["destination"]),
            )
            for line in patcher["lines"]
        }

        self.assertEqual(
            boxes["obj-2"]["text"],
            "Map this Mute button to lowercase m. Toggles selected track activators.",
        )
        self.assertEqual(boxes["obj-12"]["text"], "get tracks")
        self.assertEqual(boxes["obj-29"]["text"], "get return_tracks")
        for object_id, label in (
            ("obj-30", "print M-for-Mute-BUTTON"),
            ("obj-31", "print M-for-Mute-TRIGGER"),
            ("obj-32", "print M-for-Mute-SONG-API"),
            ("obj-33", "print M-for-Mute-TRACK-LIST"),
            ("obj-34", "print M-for-Mute-RETURN-TRACK-LIST"),
            ("obj-35", "print M-for-Mute-TRACK-ID"),
            ("obj-36", "print M-for-Mute-LIVE-API"),
            ("obj-37", "print M-for-Mute-API-ERROR"),
            ("obj-38", "print M-for-Mute-SELECTED"),
            ("obj-39", "print M-for-Mute-SET"),
        ):
            with self.subTest(label=label):
                self.assertEqual(boxes[object_id]["text"], label)

        self.assertIn((("obj-3", 0), ("obj-30", 0)), connections)
        self.assertIn((("obj-13", 0), ("obj-32", 0)), connections)
        self.assertIn((("obj-14", 0), ("obj-33", 0)), connections)
        self.assertIn((("obj-15", 0), ("obj-35", 0)), connections)
        self.assertIn((("obj-24", 0), ("obj-36", 0)), connections)
        self.assertIn((("obj-24", 1), ("obj-37", 0)), connections)
        self.assertIn((("obj-28", 0), ("obj-39", 0)), connections)

        package = (
            PROJECT_ROOT
            / "devices"
            / "m-for-mute"
            / "v0.0.3"
            / "nla_M-For-Mute-v0.0.3.amxd"
        ).read_bytes()
        self.assertEqual(package[24:28], b"ptch")
        payload_length = struct.unpack("<I", package[28:32])[0]
        embedded_patch = json.loads(package[32 : 32 + payload_length].rstrip(b"\0"))
        self.assertEqual(embedded_patch, patch_data)

    def test_m_for_mute_v0_0_4_fixes_button_and_live_object_wiring(self) -> None:
        patch_path = (
            PROJECT_ROOT
            / "devices"
            / "m-for-mute"
            / "v0.0.4"
            / "nla_M-For-Mute-v0.0.4.maxpat"
        )
        patch_data = json.loads(patch_path.read_text(encoding="utf-8"))
        patcher = patch_data["patcher"]
        boxes = {entry["box"]["id"]: entry["box"] for entry in patcher["boxes"]}
        connections = {
            (
                tuple(line["patchline"]["source"]),
                tuple(line["patchline"]["destination"]),
            )
            for line in patcher["lines"]
        }

        self.assertEqual(boxes["obj-16"]["text"], "t b b")
        self.assertEqual(boxes["obj-13"]["numoutlets"], 1)
        self.assertEqual(boxes["obj-24"]["numoutlets"], 1)
        self.assertEqual(boxes["obj-37"]["text"], "print M-for-Mute-UNROUTED")
        self.assertIn((("obj-3", 0), ("obj-16", 0)), connections)
        self.assertIn((("obj-16", 0), ("obj-12", 0)), connections)
        self.assertIn((("obj-16", 0), ("obj-29", 0)), connections)
        self.assertIn((("obj-17", 1), ("obj-37", 0)), connections)
        self.assertIn((("obj-13", 0), ("obj-14", 0)), connections)
        for line in patcher["lines"]:
            source = line["patchline"]["source"]
            self.assertLess(source[1], boxes[source[0]].get("numoutlets", 1))

        package = (
            PROJECT_ROOT
            / "devices"
            / "m-for-mute"
            / "v0.0.4"
            / "nla_M-For-Mute-v0.0.4.amxd"
        ).read_bytes()
        self.assertEqual(package[24:28], b"ptch")
        payload_length = struct.unpack("<I", package[28:32])[0]
        embedded_patch = json.loads(package[32 : 32 + payload_length].rstrip(b"\0"))
        self.assertEqual(embedded_patch, patch_data)

    def test_m_for_mute_v0_0_5_uses_retriggerable_button_and_liveapi_script(self) -> None:
        version_dir = PROJECT_ROOT / "devices" / "m-for-mute" / "v0.0.5"
        patch_path = version_dir / "nla_M-For-Mute-v0.0.5.maxpat"
        patch_data = json.loads(patch_path.read_text(encoding="utf-8"))
        patcher = patch_data["patcher"]
        boxes = {entry["box"]["id"]: entry["box"] for entry in patcher["boxes"]}
        connections = {
            (
                tuple(line["patchline"]["source"]),
                tuple(line["patchline"]["destination"]),
            )
            for line in patcher["lines"]
        }

        self.assertEqual(boxes["obj-3"]["mode"], 0)
        self.assertEqual(boxes["obj-3"]["transition"], 2)
        self.assertEqual(boxes["obj-10"]["text"], "deferlow")
        self.assertEqual(boxes["obj-11"]["text"], "js m_for_mute.js")
        self.assertIn((("obj-3", 0), ("obj-10", 0)), connections)
        self.assertIn((("obj-10", 0), ("obj-11", 0)), connections)
        self.assertTrue((version_dir / "m_for_mute.js").is_file())

        package = (version_dir / "nla_M-For-Mute-v0.0.5.amxd").read_bytes()
        self.assertEqual(package[24:28], b"ptch")
        payload_length = struct.unpack("<I", package[28:32])[0]
        embedded_patch = json.loads(package[32 : 32 + payload_length].rstrip(b"\0"))
        self.assertEqual(embedded_patch, patch_data)

    def test_m_for_mute_v0_0_6_initializes_liveapi_with_callback(self) -> None:
        script_path = PROJECT_ROOT / "devices" / "m-for-mute" / "m_for_mute.js"
        script = script_path.read_text(encoding="utf-8")
        version_script = (
            PROJECT_ROOT
            / "devices"
            / "m-for-mute"
            / "v0.0.6"
            / "m_for_mute.js"
        )
        patch_path = (
            PROJECT_ROOT
            / "devices"
            / "m-for-mute"
            / "v0.0.6"
            / "nla_M-For-Mute-v0.0.6.maxpat"
        )

        self.assertIn('new LiveAPI(apiCallback, "live_set")', script)
        self.assertIn('new LiveAPI(apiCallback, path)', script)
        self.assertIn("song.id === 0", script)
        self.assertIn("song.path", script)
        self.assertTrue(version_script.is_file())
        self.assertIn(
            'new LiveAPI(apiCallback, "live_set")',
            version_script.read_text(encoding="utf-8"),
        )

        patch_data = json.loads(patch_path.read_text(encoding="utf-8"))
        package = (
            PROJECT_ROOT
            / "devices"
            / "m-for-mute"
            / "v0.0.6"
            / "nla_M-For-Mute-v0.0.6.amxd"
        ).read_bytes()
        self.assertEqual(package[24:28], b"ptch")
        payload_length = struct.unpack("<I", package[28:32])[0]
        embedded_patch = json.loads(package[32 : 32 + payload_length].rstrip(b"\0"))
        self.assertEqual(embedded_patch, patch_data)

    def test_m_for_mute_v0_0_7_verifies_scheduled_track_changes(self) -> None:
        version_dir = PROJECT_ROOT / "devices" / "m-for-mute" / "v0.0.7"
        script = (version_dir / "m_for_mute.js").read_text(encoding="utf-8")
        patch_data = json.loads(
            (version_dir / "nla_M-For-Mute-v0.0.7.maxpat").read_text(
                encoding="utf-8"
            )
        )
        embedded = (
            version_dir / "nla_M-For-Mute-v0.0.7.amxd"
        ).read_bytes()

        self.assertIn("new Task(processNextTrack, this)", script)
        self.assertIn("processingTask.schedule(20)", script)
        self.assertIn('track.set("mute", batch.expectedMute)', script)
        self.assertIn('verifyTrack.get("mute")', script)
        self.assertIn("M-for-Mute: verified", script)
        self.assertIn("M-for-Mute ERROR:", script)
        self.assertTrue((version_dir / "m_for_mute.js").is_file())
        self.assertEqual(embedded[24:28], b"ptch")
        payload_length = struct.unpack("<I", embedded[28:32])[0]
        embedded_patch = json.loads(embedded[32 : 32 + payload_length].rstrip(b"\0"))
        self.assertEqual(embedded_patch, patch_data)

    def test_m_for_mute_v0_0_8_snapshots_before_writing_and_verifies_after(self) -> None:
        version_dir = PROJECT_ROOT / "devices" / "m-for-mute" / "v0.0.8"
        script = (version_dir / "m_for_mute.js").read_text(encoding="utf-8")
        patch_data = json.loads(
            (version_dir / "nla_M-For-Mute-v0.0.8.maxpat").read_text(
                encoding="utf-8"
            )
        )
        embedded = (
            version_dir / "nla_M-For-Mute-v0.0.8.amxd"
        ).read_bytes()

        self.assertIn('phase: "snapshot"', script)
        self.assertIn('batch.phase = "set"', script)
        self.assertIn('batch.phase = "verify"', script)
        self.assertIn("initialMute: initialMute", script)
        self.assertIn("targetMute: initialMute === 0 ? 1 : 0", script)
        self.assertIn('setTrack.set("mute", state.targetMute)', script)
        self.assertIn('verifyTrack.get("mute")', script)
        self.assertTrue((version_dir / "m_for_mute.js").is_file())
        self.assertEqual(embedded[24:28], b"ptch")
        payload_length = struct.unpack("<I", embedded[28:32])[0]
        embedded_patch = json.loads(embedded[32 : 32 + payload_length].rstrip(b"\0"))
        self.assertEqual(embedded_patch, patch_data)

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

    def test_build_prefix_requires_capitalized_device_words(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            device_dir = self.create_device(
                Path(temporary_directory), build_prefix="nla_M-for-Mute-v"
            )

            with self.assertRaisesRegex(ValueError, "capital letters"):
                build_device(device_dir)

    def test_existing_build_filenames_capitalize_device_words(self) -> None:
        for version_dir in (PROJECT_ROOT / "devices").glob("*/v*"):
            for build_path in version_dir.iterdir():
                if build_path.suffix not in {".amxd", ".maxpat"}:
                    continue
                name_without_version = re.sub(
                    r"(?:-v| v)\d+\.\d+\.\d+$", "", build_path.stem
                )
                if name_without_version.startswith("nla_"):
                    name_without_version = name_without_version[len("nla_") :]
                words = re.split(r"[- ]+", name_without_version)
                with self.subTest(build=build_path):
                    self.assertTrue(
                        all(word and word[0].isupper() for word in words),
                        f"Build filename has a lowercase device-name word: {build_path}",
                    )

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

    def test_note_length_controls_map_to_expected_grid_divisions(self) -> None:
        patch_path = (
            PROJECT_ROOT
            / "devices"
            / "note-length"
            / "v0.0.9"
            / "nla_Note-Length-v0.0.9.maxpat"
        )
        patch_data = json.loads(patch_path.read_text(encoding="utf-8"))
        patcher = patch_data["patcher"]
        boxes = {entry["box"]["id"]: entry["box"] for entry in patcher["boxes"]}
        connections = {
            (
                tuple(line["patchline"]["source"]),
                tuple(line["patchline"]["destination"]),
            )
            for line in patcher["lines"]
        }
        expected_controls = [
            ("obj-4", "obj-42", "obj-43", "obj-44", "1/1", "4"),
            ("obj-7", "obj-46", "obj-47", "obj-48", "1/2", "5"),
            ("obj-10", "obj-50", "obj-51", "obj-52", "1/4", "6"),
            ("obj-13", "obj-54", "obj-55", "obj-56", "1/8", "7"),
            ("obj-16", "obj-58", "obj-59", "obj-60", "1/16", "8"),
            ("obj-19", "obj-62", "obj-63", "obj-64", "1/32", "9"),
        ]

        for button, trigger, triplet, quantization, division, value in (
            expected_controls
        ):
            with self.subTest(division=division):
                self.assertEqual(boxes[button]["maxclass"], "live.button")
                self.assertEqual(boxes[button]["parameter_enable"], 1)
                self.assertEqual(boxes[button]["mode"], 0)
                self.assertEqual(boxes[button]["transition"], 2)
                self.assertEqual(
                    boxes[button]["saved_attribute_attributes"]["valueof"][
                        "parameter_longname"
                    ],
                    f"Note Length {division}",
                )
                self.assertEqual(boxes[trigger]["text"], "t b b")
                self.assertEqual(
                    boxes[triplet]["text"], "set grid_is_triplet 0"
                )
                self.assertEqual(
                    boxes[quantization]["text"],
                    f"set grid_quantization {value}",
                )
                self.assertIn(((button, 0), (trigger, 0)), connections)
                self.assertIn(((trigger, 1), (triplet, 0)), connections)
                self.assertIn(((trigger, 0), (quantization, 0)), connections)
                self.assertIn(((quantization, 0), ("obj-40", 0)), connections)
                self.assertIn(((triplet, 0), ("obj-40", 0)), connections)

        self.assertEqual(boxes["obj-21"]["text"], "live.path live_set view")
        self.assertEqual(boxes["obj-25"]["text"], "property detail_clip")
        self.assertEqual(boxes["obj-26"]["text"], "live.observer")
        self.assertEqual(boxes["obj-32"]["text"], "get is_midi_clip")
        self.assertEqual(boxes["obj-33"]["text"], "route is_midi_clip")
        self.assertEqual(boxes["obj-34"]["text"], "== 1")
        self.assertEqual(boxes["obj-37"]["text"], "get view")
        self.assertNotIn("get grid_quantization", {box.get("text") for box in boxes.values()})
        self.assertFalse(
            any(box.get("text", "").startswith("print NL_") for box in boxes.values())
        )
        self.assertIn((("obj-24", 1), ("obj-26", 1)), connections)
        self.assertIn((("obj-25", 0), ("obj-26", 0)), connections)
        self.assertIn((("obj-26", 0), ("obj-27", 0)), connections)
        self.assertIn((("obj-27", 0), ("obj-28", 0)), connections)
        self.assertIn((("obj-28", 1), ("obj-29", 0)), connections)
        self.assertIn((("obj-29", 1), ("obj-66", 0)), connections)
        self.assertIn((("obj-66", 0), ("obj-30", 1)), connections)
        self.assertIn((("obj-29", 0), ("obj-31", 0)), connections)
        self.assertIn((("obj-32", 0), ("obj-30", 0)), connections)
        self.assertIn((("obj-30", 0), ("obj-33", 0)), connections)
        self.assertIn((("obj-33", 0), ("obj-34", 0)), connections)
        self.assertIn((("obj-34", 0), ("obj-35", 0)), connections)
        self.assertIn((("obj-35", 0), ("obj-36", 0)), connections)
        self.assertIn((("obj-36", 0), ("obj-37", 0)), connections)
        self.assertIn((("obj-37", 0), ("obj-30", 0)), connections)
        self.assertIn((("obj-30", 0), ("obj-38", 0)), connections)
        self.assertIn((("obj-38", 0), ("obj-39", 0)), connections)
        self.assertIn((("obj-39", 0), ("obj-68", 0)), connections)
        self.assertIn((("obj-68", 1), ("obj-69", 0)), connections)
        self.assertIn((("obj-69", 1), ("obj-70", 0)), connections)
        self.assertIn((("obj-70", 0), ("obj-40", 1)), connections)
        self.assertEqual(boxes["obj-65"]["text"], "id 0")
        self.assertIn((("obj-65", 0), ("obj-40", 1)), connections)


if __name__ == "__main__":
    unittest.main()
