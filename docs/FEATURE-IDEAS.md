# Feature Ideas

Ideas are being collected for discussion and prototyping.

## Tracking format

Assign the next available ID (`F001`, `F002`, ...). Include:

- **Title**
- **Device**
- **Status**: Proposed, Exploring, Planned, Implemented, or Declined
- **User problem**
- **Proposed behavior**
- **Trade-offs or open questions**
- **References** (for researched ideas)

## Ideas

### F001 — Optionally disarm previously armed tracks on selection

- **Device**: Track Select Auto Arm
- **Status**: Complete (v0.0.8; multi-track behavior verified in Live)
- **User problem**: Some recording workflows may want only the selected track
  armed at a time.
- **Proposed behavior**: Offer an explicit option to disarm other armed tracks
  when a different selected track is armed.
- **Feasibility**: The Live Object Model exposes the selected track and the
  `arm` property as get/set, and the `Song` object exposes the track list.
  This appears feasible in Max for Live by turning off `arm` on other armable
  tracks. Track arm setting should be restricted to audio/MIDI tracks.
- **Trade-offs or open questions**: Keep this opt-in so existing intentional
  multi-arm workflows are preserved. Live's Exclusive Arm preference may
  already handle much of this behavior; decide whether the option should
  override or simply complement that preference. A safe implementation should
  avoid disarming tracks until the newly selected track is confirmed armable.
- **References**:
  [Track API](https://docs.cycling74.com/apiref/lom/track/) (`arm`,
  `can_be_armed`) and
  [Song API](https://docs.cycling74.com/apiref/lom/song/) (`tracks`,
  `exclusive_arm`).

### F002 — Investigate closer Live mixer meter matching

- **Device**: Mixer Window
- **Status**: Exploring
- **User problem**: The custom stereo meter bars previously appeared
  noticeably higher than Live's native mixer meters for the same audio.
  Meter-level visual parity is less important than the device's controls, so
  the custom bars were removed rather than continuing calibration in the
  current build.
- **Proposed behavior**: If meter visualization is revisited, use measured
  output levels and a tested mapping that follows Live's apparent meter height
  and response closely; keep meters optional if they add noticeable GUI load.
- **What has been tried**: Earlier builds read Live's
  `output_meter_left` and `output_meter_right` values (smoothed momentary peak
  readings in the documented 0-1 range), converted them to dB, and mapped that
  range to a custom -70 dB to +6 dB display. A later adjustment to the range
  did not resolve the reported height discrepancy. The user verified that
  quiet and loud material changed the bar height, so the display was responding
  to audio level rather than MIDI note velocity. No exact native-meter pixel or
  rendering API was identified.
- **Future experiments**: Compare Live's meter readings with a calibrated
  `live.meter~` under controlled signal levels; test whether peak hold,
  smoothing, channel aggregation, or display scaling explains the difference;
  investigate whether a Max-compatible visual library could help implement
  and calibrate the meter bars; and only restore a custom display after
  confirming its behavior in Live. Check library compatibility, distribution
  requirements, and GUI overhead before adopting one. Continue to treat direct
  access to Live's native meter rendering as unavailable unless a supported
  API is found.
- **Trade-offs or open questions**: Polling meter properties may add GUI load.
  `live.meter~` is a possible reference, not a proven drop-in replacement for
  Live's native mixer meters. Any future meter work should be validated in Live.
- **References**:
  [Cycling '74 Track API](https://docs.cycling74.com/apiref/lom/track/)
  (`output_meter_left`, `output_meter_right`) and
  [Max `live.meter~` reference](https://docs.cycling74.com/max8/refpages/live.meter~).

### F003 — Add multi-track selection from Mixer Window

- **Device**: Mixer Window
- **Status**: Proposed
- **User problem**: Multi-track selections made in Live are reflected in the
  Mixer Window, but initiating a Cmd-click additive selection or a Shift-click
  range selection from the Mixer Window does not update Live.
- **Proposed behavior**: Preserve ordinary click-to-select behavior, add
  Cmd-click to add or remove a specific track, and Shift-click to select the
  range from the current selection to the clicked track, matching Live's
  selection behavior.
- **Feasibility**: The documented Live Object Model exposes
  `Song.View.selected_track` as a get/set property for one track.
  `Track.is_part_of_selection` is get-only, so a device can mirror Live's
  multi-selection but has no documented supported API for setting that
  multi-track selection. Max `jsui` can receive mouse modifier arguments, but
  detecting Cmd/Shift does not provide a supported Live selection write path.
  This finding is based on the documented `Song`, `Song.View`, and `Track`
  APIs; undocumented or version-specific behavior has not been ruled out.
- **Trade-offs or open questions**: Keep the current implementation contained
  to Ableton and do not use OS-level input for now. Synthetic OS mouse input
  could be investigated as a later possibility only if explicitly revisited;
  it would be brittle, platform-specific, and outside Live's supported API.
- **References**:
  [Song.View API](https://docs.cycling74.com/apiref/lom/song_view/)
  (`selected_track`) and
  [Track API](https://docs.cycling74.com/apiref/lom/track/)
  (`is_part_of_selection`).
