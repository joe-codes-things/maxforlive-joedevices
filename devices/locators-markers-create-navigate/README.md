# Locators (Markers) Create Navigate

## v0.0.2

This device provides three Arrangement locator controls:

- **Set/Delete Locator** calls the Live Object Model's `Song.set_or_delete_cue`
  at the current Arrangement position. Map this control to the backtick (`).
- **Previous Locator** moves the Arrangement playhead to the closest locator
  before its current position. Map it to Num Pad 7.
- **Next Locator** moves the Arrangement playhead to the closest locator after
  its current position. Map it to Num Pad 9.

The navigation controls set `Song.current_song_time` to the selected locator
time rather than invoking Live's Previous/Next Locator buttons, which the Live
manual describes as launching playback. The script checks that the transport's
playing/stopped state is unchanged. It does not change `Song.start_time`.

Open the Max Console to see startup, trigger, target-position, locator-count,
and transport diagnostics. Errors use the
`Locators-Markers-Create-Navigate ERROR:` prefix. If there is no locator in the
requested direction, the script logs that no action was taken.

Ableton's Live 12 manual documents the Set Locator and Delete Locator
Arrangement controls and says the Previous/Next Locator buttons launch
playback. Cycling '74's Song API documents `cue_points`, the settable
`current_song_time` property, and the `set_or_delete_cue` function; the CuePoint
API exposes each locator's Arrangement `time`.

The user confirmed that all three controls work in Live. The mappings are
backtick (`), Num Pad 7, and Num Pad 9.

Keep `locators_markers_create_navigate.js` beside the `.amxd` when installing
the device in Live.

References:

- [Live 12 Arrangement View](https://www.ableton.com/en/live-manual/12/arrangement-view/)
- [Live 12 Key Remote Control](https://www.ableton.com/en/live-manual/12/midi-and-key-remote-control/)
- [Cycling '74 Song API](https://docs.cycling74.com/apiref/lom/song/)
- [Cycling '74 CuePoint API](https://docs.cycling74.com/apiref/lom/cuepoint/)
