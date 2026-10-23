# Set Note Lengths

## v0.0.2

Turn off Live's **Computer MIDI Keyboard** (also called Musical Typing), then
select one or more MIDI notes in the active MIDI clip's Note Editor and map the
device's **Set Lengths** button to lowercase `l` in Key Map Mode. Pressing the
button sets the selected notes' durations to the active Clip View grid. Note
start times and other note properties are left unchanged.

The current straight or triplet grid is read from the active Clip View. The
device supports grid divisions from 1/1 through 1/32, including triplet
divisions. If no clip is open, the active clip is not MIDI, or no notes are
selected, it makes no note edits and reports the reason in the Max Console.

Diagnostics use the `Set-Note-Lengths:` prefix; errors use
`Set-Note-Lengths ERROR:`. The console reports the active clip, grid division,
selected note count, each duration change, and the number of notes already at
the target duration.

The implementation uses the Live Object Model's
`Clip.get_selected_notes_extended`, `Clip.apply_note_modifications`, and
`Clip.View.grid_quantization` / `grid_is_triplet`. The modification contains
only each selected note's ID and new duration, preserving start times and
other note properties. The user confirmed that the device works in Live.

Keep `set_note_lengths.js` beside the `.amxd` when installing the device.

References:

- [Live 12 MIDI and Key Remote Control](https://www.ableton.com/en/live-manual/12/midi-and-key-remote-control/)
- [Live 12 Keyboard Shortcuts](https://www.ableton.com/en/live-manual/12/live-keyboard-shortcuts/)
- [Cycling '74 Clip API](https://docs.cycling74.com/apiref/lom/clip/)
- [Cycling '74 Clip View API](https://docs.cycling74.com/apiref/lom/clip_view/)
