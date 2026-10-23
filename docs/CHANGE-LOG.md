# Changelog

All notable changes to the devices in this repository are documented here.

## Locators (Markers) Create Navigate

### v0.0.3

- Move the Arrangement Play Start Indicator (`Song.start_time`) together with
  the cursor (`Song.current_song_time`) when navigating to an adjacent locator.
- Confirmed by the user: pressing Space after navigation starts playback from
  the newly selected locator.
- Added Play Start Indicator readback validation and a transport-state check so
  navigation does not start or stop playback.

### v0.0.2

- Updated the Previous and Next Locator mapping instructions to Num Pad 7 and
  Num Pad 9. Set/Delete Locator remains mapped to backtick (`).
- Confirmed by the user that the device works in Live.

### v0.0.1

- Added Set/Delete Locator, Previous Locator, and Next Locator controls with
  Max Console diagnostics.
- Used the Live Object Model's `set_or_delete_cue`, `cue_points`, and
  `current_song_time` APIs; navigation checks transport state and does not call
  Live's locator buttons that launch playback.
- Documented the initial backtick and Option+Arrow Key Map Mode assignments.

## Single Bar Jump

### v0.0.4

- Set both mapped buttons to emit a bang on either value transition, following
  the working key-mappable button pattern used by the other devices. Repeated
  mapped keypresses no longer depend on the button indicator being off.
- Confirmed by the user to work in Live with comma/period mappings and repeated
  single-press navigation regardless of the oval indicator state.

### v0.0.3

- Changed Back and Forward buttons to momentary mode, allowing each mapped
  keypress to fire without toggling a latched UI state.
- Move the Scrub Area with Live's documented `Song.jump_by` function instead
  of setting `current_song_time` and immediately assuming its readback is
  synchronous.
- Log the requested jump and observed current position without treating a
  delayed `current_song_time` readback as a failed movement.

### v0.0.2

- Fixed the button trigger path: `live.button` sends a bang, so each control
  now converts that bang into its direction value before calling the script.
- Changed the button transition to emit one trigger on press instead of also
  triggering on release.
- Added a Max Console message on script load so installation and dependency
  loading can be diagnosed before pressing either control.

### v0.0.1

- Added Back and Forward controls that move both Arrangement positions by one
  bar, calculated from the Live Set time signature.
- Added Max Console diagnostics and transport-state checks.
- Documented the comma/period Key Map Mode assignments and the need to verify
  punctuation-key support on the user's keyboard layout in Live.

## Show VST Instrument

### v0.0.5

- Updated the UI mapping instruction from `Cmd+E` to lowercase `e`, matching
  Live's single-key Key Map Mode mapping.

### v0.0.4

- Added a Live version and `is_editor_open` availability check before accessing
  the plug-in editor property.
- Research indicates this property requires Live 12.4.3 or later. The user's
  Live 12.3.5 test confirmed that the property is unavailable there.
- The device remains in development. Its intended editor toggle still requires
  validation in Live 12.4.3 or later.

## Show Device View

### v0.0.2

- Open Device View using `focus_view("Detail/DeviceChain")` and hide the
  containing Detail panel when Device View is already active. This avoids
  switching between Clip View and Device View.
- Confirmed working in Live: Device View opens directly, and the next press
  hides the Detail panel.

### v0.0.1

- Added a key-mappable button to toggle the visibility of Live's
  `Detail/DeviceChain` view through the documented Application.View API.
- Documented mapping the button to lowercase `x` in Key Map Mode.

## Back to Start

### v0.0.2

- Set both `Song.current_song_time` (Scrub Area position) and `Song.start_time`
  (Play Start Indicator) to beat 0, then verify both values and transport
  state.
- Confirmed working in Live: both Arrangement positions return to bar 1 without
  starting or stopping playback.

### v0.0.1

- Added a key-mappable control to set the global Arrangement position to beat
  0 through `Song.current_song_time`, without calling playback or clip-launch
  functions.
- Added Max Console diagnostics for transport state, current position, and an
  open Detail View clip.
- Documented that scrolling an open clip editor to its beginning is not
  available through the documented Clip View API.

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
