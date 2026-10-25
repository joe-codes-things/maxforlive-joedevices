# Bugs

## Current bugs

### B003 — Show VST Instrument requires a newer Live version

- **Device**: Show VST Instrument (`devices/show-vst-instrument/`)
- **Status**: Open
- **Device version(s)**: v0.0.1-v0.0.5
- **Environment**: Ableton Live 12.3.5, Max for Live; macOS
- **Steps to reproduce**: Load the device on a MIDI track with a VST
  instrument and press its mapped lowercase `e` button.
- **Expected behavior**: The selected track's first VST instrument editor
  opens or closes.
- **Actual behavior**: Live 12.3.5 reports that `PluginDevice` has no
  `is_editor_open` attribute. The device cannot control the plug-in window.
- **Investigation**: The current Cycling '74 API documents the property, but
  does not specify its introduction version. An independent Max for Live
  implementation gates it on Live 12.4.3 or later. No documented per-device
  API workaround for Live 12.3.5 was found.
- **Workaround**: Update Live to 12.4.3 or later, then test v0.0.5. Do not
  consider the device working until the editor toggle is confirmed in Live.

### B005 — Mixer Window reduces Live UI responsiveness

- **Device**: Mixer Window (`devices/mixer-window/`)
- **Status**: Open; cause not yet confirmed
- **Device version(s)**: v0.0.8
- **Environment**: User report is from Ableton Live on macOS. Exact Live, Max,
  and macOS versions were not re-confirmed for this report; the project was
  previously tested with Live 12.3.5 and Max 9.2.
- **Reported reproduction**: With Mixer Window loaded and active, scroll
  horizontally in Session View and select different tracks in Arrangement
  View. Confirm whether the slowdown begins on device load or only after
  clicking the device button to open the mixer.
- **Expected behavior**: Live's Session and Arrangement interfaces remain
  responsive while Mixer Window is in use.
- **Actual behavior**: The user reports that horizontal scrolling becomes
  jumpy and Arrangement track selection feels delayed while the mixer is
  visible.
- **Investigation**: Source review identifies a plausible UI/API workload, but
  no runtime profile or controlled A/B test has confirmed the cause:
  - After the mixer is opened and its initial channel scan completes, the
    backend schedules `updateTrackStates()` with a 50 ms delay and repeats it
    after every pass. This is a maximum cadence of 20 sweeps per second before
    accounting for the work performed in each sweep. Each sweep visits every
    track, including channels not currently visible, and reads volume and pan
    values/display strings, track activator/Solo/Arm state, each available
    send value, selection state, and track color. For a typical regular track
    with three sends, this is about 12 Live API property reads per sweep, or up
    to about 240 reads per second per track if each pass finishes quickly.
  - Each track's state is sent separately to the UI. The UI's `state()` handler
    calls `redraw()` for every track update, and `paint()` redraws the entire
    visible mixer canvas. This may request multiple full-canvas redraws during
    each state sweep; whether Max coalesces these redraw requests and how much
    time they consume has not been measured.
  - The device's repeated state scan begins after the user presses the device
    button to open the mixer; Live API readiness alone does not start it.
    Because the report describes the device as "loaded," testing the loaded
    but unopened state separately is important.
  - The device also rescans channel structure and routing choices every two
    seconds. The recurring state and structure tasks continue after the mixer
    has been opened; closing the separate window does not currently cancel
    them in the source.
  - The Live Object Model documentation says the Live API runs on Live's main
    thread. It also documents observable parameter values and several
    observable track properties, which could support event-driven updates
    instead of repeatedly querying those properties. `Track.is_part_of_selection`
    is get-only, so that particular value would still need another strategy.
    Ableton's manual notes that Live's CPU meter measures audio processing
    load, not UI-management work; a normal CPU-meter reading alone therefore
    cannot rule out this UI responsiveness problem.
  - Meter-bar polling is not a current cause candidate: the custom meters were
    removed in v0.0.7.
- **References**:
  [Backend polling loop](../devices/mixer-window/mixer_window.js#L16),
  [state sweep](../devices/mixer-window/mixer_window.js#L268),
  [per-track state output](../devices/mixer-window/mixer_window.js#L1120),
  [UI state handler](../devices/mixer-window/mixer_window_ui.js#L166), and
  [canvas drawing](../devices/mixer-window/mixer_window_ui.js#L273);
  Cycling '74
  [Live API guide](https://docs.cycling74.com/userguide/m4l/live_api/),
  [live.observer reference](https://docs.cycling74.com/reference/live.observer/),
  [DeviceParameter API](https://docs.cycling74.com/apiref/lom/deviceparameter/),
  and [Track API](https://docs.cycling74.com/apiref/lom/track/); Ableton's
  [Computer Audio Resources and Strategies](https://www.ableton.com/en/live-manual/12/computer-audio-resources-and-strategies/)
  (CPU meter coverage).
- **Ideas for investigation**: First compare four conditions in the same Set:
  device absent; device loaded but never opened; mixer open; mixer closed after
  it has been opened. Repeat with playback/automation stopped and active, then
  with increasing track and return/send counts. Record exact Live/Max/macOS
  versions and compare Live UI responsiveness as well as process CPU usage;
  interpret Live's CPU meter as audio-load evidence only. If confirmed, profile
  the time and API-read count per sweep, replace polling with Live API
  observers for properties that support observation, retain only low-rate
  polling for unsupported properties, batch state messages, and coalesce UI
  redraws to at most one per update/frame. Consider reducing or pausing work
  for off-screen channels and when the mixer window is hidden, and avoid
  rebuilding routing choices unless tracks or routing options actually change.
  Observation is a promising way to avoid redundant reads, not a guarantee of
  zero load: rapidly automated parameters can still produce frequent change
  notifications and should be coalesced before repainting.
- **Workaround**: No confirmed workaround. Removing or disabling the device is
  the most useful comparison test. Merely closing the mixer window may not
  stop its backend polling after the first open; this is inferred from source
  and needs runtime confirmation.

## Bugs resolved

### B004 — S for Solo key mapping interferes with Solo behavior

- **Device**: S for Solo (`devices/s-for-solo/`)
- **Status**: Resolved by a user-reported project setup change; no device code
  change
- **Affected versions**: v0.0.5 and v0.0.6
- **Environment**: Ableton Live and Max for Live; exact versions and OS not
  recorded
- **Observed behavior**: Solo did not work as expected while the device was
  loaded. The user later reported that armed devices elsewhere in the project
  were interfering with the test.
- **Resolution**: Unarm all devices across the project before using S for
  Solo. The user identified this as the condition needed for the device to
  work. The cause has not been independently reproduced.
- **Code changes**: None.

### B001 — Selected-track arm query stalls

- **Device**: Track Select Auto Arm
- **Status**: Resolved in v0.0.3; confirmed working by user in Live
- **Affected versions**: v0.0.1 and v0.0.2; fixed in v0.0.3
- **Environment**: Ableton Live 12.3.5, Max for Live
- **Steps to reproduce**: Load v0.0.1 on the Master track and select an audio
  or MIDI track.
- **Expected behavior**: An eligible selected track that is disarmed becomes
  armed.
- **Actual behavior**: In v0.0.1 and v0.0.2, the device did not arm the
  selected track.
- **Investigation**: The original v0.0.1 patch sends `live.object` output
  directly to numeric selectors. The response format and Live API behavior
  cannot be confirmed from the patch file alone, so the exact runtime cause is
  not yet established.
- **Fix**: v0.0.3 routes tagged or bare property responses before numeric
  checks and defers the eligibility query out of the selection notification.
- **Validation**: The user confirmed v0.0.3 works in Ableton Live.
- **Workaround**: Use v0.0.3 or a later build.

## Reporting format

Assign the next unused sequential ID. Include:

- **Title**
- **Device**
- **Status**: Open, In Progress, Fixed, or Closed
- **Device version(s)**
- **Environment**: Live and Max versions, OS, and relevant Set configuration
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **Workaround** (if any)
