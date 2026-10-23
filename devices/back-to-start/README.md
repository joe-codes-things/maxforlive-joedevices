# Back to Start

Add the `.amxd` device to a Live Set, then map its **Start** button to Num Pad
0 in Key Map Mode. The button sets both Live's Scrub Area position
(`current_song_time`) and the Play Start Indicator (`start_time`) to beat 0
(bar 1). It does not call a playback, clip-launch, or stop function. The script
verifies both positions and checks that transport state is unchanged. Version
0.0.2 has been confirmed working in Live.

This device does not navigate the horizontal position inside an open MIDI or
audio Clip View. The documented Clip View API exposes grid and envelope
operations, but no editor-scroll or clip-editor playhead setter. If a clip is
open in Detail View, the Max Console reports its type, object id, and path,
then notes that the device moves the global Arrangement positions instead.
This applies to Session and Arrangement clips.

Diagnostics use the `Back-to-Start:` prefix in the Max Console; failures are
reported with `Back-to-Start ERROR:`. Keep the required `back_to_start.js`
script beside the `.amxd` when installing it in Live. The manifest and
`.maxpat` are build inputs and are not required in Live.

The implementation uses the documented `Song.current_song_time` and
`Song.start_time` properties. Both are get/set positions measured in beats;
`current_song_time` is the playing position, while `start_time` is where
playing will start. Cycling '74 documents them in the
[Song API](https://docs.cycling74.com/apiref/lom/song/). The open Detail View
clip is queried through
[`Song.View.detail_clip`](https://docs.cycling74.com/apiref/lom/song_view/).
Live's [Key Remote Control manual](https://www.ableton.com/en/live-manual/12/midi-and-key-remote-control/)
documents computer-keyboard mappings; map the button in Key Map Mode rather
than expecting the device to install a Num Pad 0 assignment automatically.

The Live button must be mapped to Num Pad 0 in Key Map Mode; the device does
not assign the key automatically.
