# Changelog

All notable changes to the devices in this repository are documented here.

## Mixer Window

### v0.0.8

- Simplified send labels to their first letter and removed the sends page
  counter text while retaining the page arrows.
- Positive typed dB values now clamp to 0 dB; values rounding to zero display
  as `0.00 dB` without a negative sign.
- The dB editor selects its text on entry, supports double-click select-all,
  and flashes the caret every 500 ms.
- Clarified that mixer-originated track selection currently supports one track;
  multi-track selection is tracked as F003 because the documented Live API has
  no supported multi-selection setter.

### v0.0.7

- Removed the custom stereo meter bars and their high-polling-rate reads.
  Meter mismatch research and possible future experiments are recorded as
  feature idea F002; the old open bug entry was removed.
- Added keyboard track navigation, track activator/solo/arm controls, and
  dynamic send knobs backed by Live's mixer-device send parameters.
- Added two-decimal dB readout editing with Return to commit and Escape to
  discard, plus a more forgiving fader-nub double-click reset.
- Filled the panning slider toward its current pan position in the same blue
  used for sends, added routing-menu hover feedback, removed bottom track
  labels, and constrained the fader divider below the control/send area.
- No separate arm-glyph image files were found in the installed Live image
  resources; arm buttons use the requested temporary `R`.

### v0.0.6

- Volume dragging now starts only when grabbing the fader nub; clicking the
  surrounding strip still selects its track.
- Routing menu writes now pass Live's routing dictionary with a numeric
  identifier where applicable, and Max Console diagnostics report the chosen
  option and Live's readback.

### v0.0.5

- Adjusted stereo meter height to use Live's documented 0-1 smoothed peak
  readings over a -70 dB to +6 dB display range.
- Added pan double-click-to-center, click-to-select tracks, and a draggable
  fader-area divider; reduced selected-strip tint and subtly applied track
  colors to the strip backgrounds.
- Removed the volume label, added separation between volume and pan readouts,
  and show pan as a non-negative integer with an L/R suffix.
- Routing menus now send the Live routing choice dictionary and verify the
  result. They remain open across automatic refreshes and can be dismissed by
  clicking away or pressing Escape.
- Removed the misleading "Unavailable" route label. Live validation is still
  required.

### v0.0.4

- Added horizontal pan controls, functional routing selectors using Live's
  available routing choices, and faster visual updates for mixer state.
- Matched track-strip colors to Live track colors and highlighted selected
  tracks; fixed track names that arrived with API quote wrappers.
- Added stereo output-level meters using Live's left/right output-meter
  properties, and removed the extra header/footer instructional text.
- Note: Live documents left/right output-meter reads as potentially adding
  GUI load; validate performance with large Sets.

### v0.0.3

- Made the channel-strip layout responsive to the pop-out window size and
  adjusted the number of visible channels to fit.
- Added readable routing-label extraction, a dB scale, two-decimal dB readouts,
  and double-click-to-set-0-dB faders.
- Limited the fader range to 0 dB using Live's `DeviceParameter.str_for_value`
  display mapping so the normalized parameter range is not mistaken for dB.
- Improved the channel-strip styling to more closely resemble Live's mixer.
  These changes still require validation in Live.

### v0.0.2

- Fixed the open button trigger path by routing the `live.button` bang directly
  through `deferlow` instead of filtering for the integer `1`.
- Added explicit Max Console messages when the open trigger is received and
  channel refresh begins.

### v0.0.1

- Added a separate custom Max window with Live-inspired channel strips,
  vertical volume faders, and read-only input/output routing labels.
- Included regular tracks, return tracks, and Master; new and removed tracks
  are discovered during periodic refreshes.
- Added diagnostics and support for JavaScript UI dependencies inside nested
  patchers. Live validation is still required.

## Set Note Lengths

### v0.0.2

- Added an on-device reminder to turn off Computer MIDI Keyboard before using
  the `l` mapping.

### v0.0.1

- Added a lowercase-`l` mapped control that sets selected MIDI note durations
  to the active clip's current straight or triplet grid size.
- Added Max Console diagnostics for startup, active clip/grid, selected note
  count, per-note duration changes, and errors.
- Preserves selected note start times and other note properties. Confirmed
  working by the user in Live.

## Grid Size (formerly Note Length)

### v0.0.10

- Renamed the existing Note Length grid-selection device to Grid Size and
  updated its local build names and labels to distinguish it from Set Note
  Lengths.
- Kept its existing six divisions and Num Pad 1–6 mappings.

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

## Show Clip View

### v0.0.2

- Changed the on-device mapping instruction and digest to lowercase `z`.
- The Clip View toggle behavior was confirmed by the user in v0.0.1.

### v0.0.1

- Added a key-mappable button that toggles Live's `Detail/Clip` view using the
  documented Application.View API.
- Documented mapping the button to lowercase `c` in Key Map Mode.
- Created the initial device build.

## Show Browser

### v0.0.1

- Added a key-mappable button to toggle Live's Browser using the documented
  `Application.View` API.
- Documented mapping the button to the main keyboard row's `1`, explicitly
  distinguishing it from numpad `1`.
- Confirmed by the user in Live: the top-row `1` mapping works and is distinct
  from numpad `1`.

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

### v0.0.6

- Clarified in the device UI that Computer MIDI Keyboard must be turned off
  before using the lowercase-`s` mapping.
- A later user report found that Solo did not work as expected while v0.0.5
  or v0.0.6 remained loaded after mapping `s`; removing the device restored
  Solo behavior. The cause is under investigation.

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
