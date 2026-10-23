# maxforlive-joedevices

A collection of Max for Live devices and development notes for Ableton Live.

Track Select Auto Arm arms an eligible track when it becomes selected. Its Max
patch and packaged device are in
[`devices/track-select-auto-arm/`](devices/track-select-auto-arm/). Add it as a
Max Audio Effect on the Master track to monitor global track selection while
passing audio through unchanged.

S for Solo provides a key-mappable Solo control for selected tracks. Add its
`.amxd` device to a Live Set, map the device's Solo control to lowercase `s` in
Key Map Mode, and turn off Live's Computer MIDI Keyboard (Musical Typing) so it
does not intercept the shortcut. The latest build is
[`devices/s-for-solo/v0.0.5/nla_S-For-Solo-v0.0.5.amxd`](devices/s-for-solo/v0.0.5/nla_S-For-Solo-v0.0.5.amxd).

Note Length is an early step-input prototype for changing the active MIDI
clip's grid, so the selected division is used for notes entered next. Map its
six controls to Num Pad 1–6 in Key Map Mode. See
[`devices/note-length/`](devices/note-length/) for the mapping and current
limitations.

M for Mute provides a key-mappable Mute control for selected tracks. Add the
device to a Live Set and map its Mute button to lowercase `m` in Key Map Mode.
The button checks the current track selection; do not map individual track
activators. Version 0.0.8 snapshots the initial states of all selected tracks
before applying changes, then verifies the final states through the Live API.
Multi-track toggling has been verified for pairs and larger groups of MIDI and
audio tracks. Keep the required `m_for_mute.js` script beside the `.amxd`. See
[`devices/m-for-mute/`](devices/m-for-mute/) for setup and diagnostic details.

Q for Quantize v0.0.6 is complete and verified in Live. Open a MIDI clip in
Detail View, select notes, and map its Quantize button to lowercase `q` in Key
Map Mode. It quantizes selected note starts to the active clip grid without
changing their lengths or unselected notes. Install the
[`v0.0.6 device`](devices/q-for-quantize/v0.0.6/nla_Q-For-Quantize-v0.0.6.amxd)
with its required `q_for_quantize.js` script beside it. See
[`devices/q-for-quantize/`](devices/q-for-quantize/) for setup details.

Show VST Instrument is in development. Its v0.0.5 prototype requires Live
12.4.3 or later; it cannot control plug-in windows in the user's current Live
12.3.5. Once Live is updated, select a MIDI track and map its VST Window
button to lowercase `e` in Key Map Mode. It is intended to toggle the first
VST instrument editor on that track, including instruments nested in racks.
Install the
[`v0.0.5 device`](devices/show-vst-instrument/v0.0.5/nla_Show-VST-Instrument-v0.0.5.amxd)
with the required `show_vst_instrument.js` script beside it. See
[`devices/show-vst-instrument/`](devices/show-vst-instrument/) for setup and
diagnostic details. Live 12.4.3+ compatibility still needs testing.

Show Device View v0.0.2 provides a key-mappable button that opens Device View
directly and hides the Detail panel on the next press. Add it to a Live Set and
map the button to lowercase `x` in Key Map Mode. Keep the required
`show_device_view.js` script beside the
[`v0.0.2 device`](devices/show-device-view/v0.0.2/nla_Show-Device-View-v0.0.2.amxd).
This behavior has been confirmed working in Live. See
[`devices/show-device-view/`](devices/show-device-view/) for setup and API
details.

Back to Start v0.0.2 provides a key-mappable button that moves both Live's
Scrub Area position and Play Start Indicator to bar 1 without starting
playback. This version has been confirmed working in Live. Map its Start
button to Num Pad 0 in Key Map Mode. It does not scroll an open clip editor;
see [`devices/back-to-start/`](devices/back-to-start/) for setup, diagnostics,
and API details.

Single Bar Jump v0.0.4 provides Back and Forward buttons to move the
Arrangement Scrub Area and Play Start Indicator by one bar, with the bar length
calculated from the Live Set time signature. Map Back to comma and Forward to
period in Key Map Mode. The user confirmed the mappings and repeated
single-press behavior work in Live. See
[`devices/single-bar-jump/`](devices/single-bar-jump/) for setup, diagnostics,
and remaining limitations. The buttons emit on either state transition,
following the working mapped-button pattern used by the other devices.

Locators (Markers) Create Navigate v0.0.3 provides a Set/Delete Locator
control and Previous/Next Locator controls for Arrangement. Map Set/Delete to
backtick (`), Previous to Num Pad 7, and Next to Num Pad 9 in Key Map Mode.
Navigation moves both the Arrangement playhead and Play Start Indicator to an
adjacent locator, so playback started with Space begins there. It does this
without starting playback during navigation. The user confirmed that the
device works in Live; see
[`devices/locators-markers-create-navigate/`](devices/locators-markers-create-navigate/)
for setup and diagnostics.

## Building a new version

Each device is maintained in its own folder under `devices/`, with a
`device.json` manifest defining its display name and build filename prefix.
Edit the latest versioned `.maxpat` in that device's version folder, then pass
the device folder to the build script:

```sh
python3 scripts/build_device.py devices/track-select-auto-arm
```

The script versions each device independently and creates a new folder
containing its matching `.maxpat` source and `.amxd` device. The latest
supported Track Select Auto Arm build is
`devices/track-select-auto-arm/v0.0.4/nla_Track-Select-Auto-Arm-v0.0.4.amxd`.
Existing builds are never overwritten. Builds are created only in this
repository; installing or copying them into Ableton's User Library is a
manual step for the user.

To add a device, create a folder with a `device.json` containing its display
`name` and a `build_prefix` in the `nla_<Device-Name>-v` form, then put one
initial `.maxpat` source in that folder. Capitalize each device-name word in
the prefix; only `nla` and the version's `v` are lowercase. Running the builder
for that folder creates its v0.0.1 build. See
`devices/track-select-auto-arm/device.json` for an example manifest.

**Made with care by Nine Lives Audio**
