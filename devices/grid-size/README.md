# Grid Size

This device sets the active MIDI clip's grid division. Open a MIDI clip in
Live's Detail View, then map the six controls in Key Map Mode:

| Grid division | Key |
| --- | --- |
| 1/1 | Num Pad 6 |
| 1/2 | Num Pad 5 |
| 1/4 | Num Pad 4 |
| 1/8 | Num Pad 3 |
| 1/16 | Num Pad 2 |
| 1/32 | Num Pad 1 |

The device changes the open MIDI clip's straight grid division. It does not
resize existing notes; the intent is to set the grid for notes entered next
during step input. Audio clips and sets without an open MIDI clip are ignored.

The device observes the Song View's `detail_clip` child, checks
`is_midi_clip` with a `live.object` query (it is get-only and cannot be
observed), and only sends grid changes to an active MIDI clip's view.

The controls send their action on both on and off transitions, so a key
reapplies its grid division each time it is pressed, even if its oval was
already lit. Live's grid quantization values are mapped as follows: 4 = 1/1,
5 = 1/2, 6 = 1/4, 7 = 1/8, 8 = 1/16, and 9 = 1/32. The oval controls toggle
independently and can leave more than one division lit; this does not prevent
their mapped keys from changing the grid.

This device was renamed locally from Note Length to Grid Size to distinguish
choosing the editor grid from the separate Set Note Lengths device, which
changes selected note durations.
