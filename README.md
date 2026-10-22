# maxforlive-joedevices

A collection of Max for Live devices and development notes for Ableton Live.

The initial device, Track Select Auto Arm, arms an eligible track when it
becomes selected. Its Max patch and packaged device are in
[`track-select-auto-arm/`](track-select-auto-arm/). Add it as a Max Audio
Effect on the Master track to monitor global track selection while passing
audio through unchanged.

## Building a new version

Each device is maintained in its own top-level folder with a `device.json`
manifest defining its display name and build filename prefix. Edit the latest
versioned `.maxpat` in that device's version folder, then pass the device
folder to the build script:

```sh
python3 scripts/build_device.py track-select-auto-arm
```

The script versions each device independently and creates a new folder
containing its matching `.maxpat` source and `.amxd` device. For example, the
Track Select Auto Arm build is
`track-select-auto-arm/v0.0.4/nla_Track-Select-Auto-Arm-v0.0.4.amxd`.
Existing builds are never overwritten.

To add a device, create a folder with a `device.json` containing its display
`name` and a `build_prefix` in the `nla_<Device-Name>-v` form, then put one
initial `.maxpat` source in that folder. Running the builder for that folder
creates its v0.0.1 build. See `track-select-auto-arm/device.json` for an
example manifest.
