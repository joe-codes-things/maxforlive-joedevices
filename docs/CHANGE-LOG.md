# Changelog

All notable changes to the devices in this repository are documented here.

## S for Solo

### v0.0.5

- Cleaned up the device UI by removing prototype diagnostic fields.
- Documented mapping the device's Solo control to lowercase `s` in Live's
  Key Map Mode.
- Confirmed by the user to work with single and multiple selected tracks after
  disabling Live's Computer MIDI Keyboard (Musical Typing), which had been
  intercepting the `s` key.

## Track Select Auto Arm

### v0.0.6

- Withdrawn development attempt: the user reported that this build did not
  operate in Ableton Live.
- The v0.0.6 files have been removed; v0.0.4 remains the latest supported
  build.

### v0.0.5

- Withdrawn development attempt: the user reported that this build did not
  operate in Ableton Live.
- The v0.0.5 files have been removed; v0.0.4 remains the latest supported
  build.

### v0.0.4

- Adopted the Nine Lives Audio filename convention:
  `nla_Track-Select-Auto-Arm-v0.0.4.amxd`.
- Stored the build in its own versioned folder.
- Added this device to the shared, independently versioned multi-device build
  workflow.
- Kept the selected-track auto-arm behavior from v0.0.3; this release did not
  introduce a functional change to the device.

### v0.0.3

- Revised the Live API response handling to route `can_be_armed` and `arm`
  replies separately, including tagged and bare property values.
- Deferred eligibility handling so the selected-track response could be
  processed reliably.
- Confirmed by the user to work in Ableton Live.

### v0.0.2

- Reworked the Live API query flow to use separate property queries for track
  arm eligibility and arm state.
- This second implementation attempt still did not work in the user's Live
  testing.

### v0.0.1

- First versioned build of the selected-track auto-arm device.
- The initial implementation attempted to observe Live's selected track and
  arm it when eligible.
- The user reported that it did not work in Live.
