# Show VST Instrument

This device requires **Ableton Live 12.4.3 or later**. The current
[Cycling '74 PluginDevice API reference](https://docs.cycling74.com/apiref/lom/plugindevice/)
documents `is_editor_open`, but does not state when it was introduced. A
[public Max for Live implementation](https://github.com/zsteinkamp/m4l-Knobbler4/blob/main/src/k4-pluginWindow.ts#L21-L23)
sets 12.4.3 as the minimum and says earlier versions do not expose it. This
matches testing in Live 12.3.5, which reports that the property is absent.
No documented per-device API workaround for Live 12.3.5 was found. Live's
Cmd+Option+P shortcut only toggles visibility of already-open plug-in windows
globally; it cannot open or target this selected track's VST by itself.

With a supported version, add the device to a Live Set, select a MIDI track,
and map its **VST Window** button to lowercase `e` in Key Map Mode. The device
toggles the first VST instrument editor found on the selected track. If the
track has no VST instrument, the device reports that in the Max Console and
makes no change.

The search follows device-chain order and descends into nested racks. If more
than one VST instrument is present, only the first is toggled; the Max Console
logs the chosen device path and how many VST instruments were found. The
device operates on the currently selected track only, not all selected tracks.

The latest build is v0.0.5. Its UI instruction uses lowercase `e` to match
Live's supported single-key mapping. Keep its required
`show_vst_instrument.js` script
beside the `.amxd` when installing it in Live. The manifest and `.maxpat` are
build inputs and are not required in Live.

Diagnostics use the `Show-VST-Instrument:` prefix in the Max Console. The
device reports the Live version, each device/chain count, and the object
references returned by Live. It checks Live's version and confirms the device
exposes `is_editor_open` before accessing the property, then verifies the
editor state changes before reporting success.
