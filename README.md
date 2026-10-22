# maxforlive-joedevices

A collection of Max for Live devices and development notes for Ableton Live.

The initial device, Track Select Auto Arm, arms an eligible track when it
becomes selected. Its Max patch and packaged device are in
[`track-select-auto-arm/`](track-select-auto-arm/). Add it as a Max Audio
Effect on the Master track to monitor global track selection while passing
audio through unchanged.

## Building a new version

Edit the latest versioned `.maxpat` in its version folder, then run:

```sh
python3 scripts/build_device.py
```

The build creates a new version folder containing a matching `.maxpat` source
and `.amxd` device. Builds use the `nla_Track-Select-Auto-Arm-vX.Y.Z` filename
convention (for example, `track-select-auto-arm/v0.0.4/nla_Track-Select-Auto-Arm-v0.0.4.amxd`).
The patch version increments automatically, and existing builds are never
overwritten.
