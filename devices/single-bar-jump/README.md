# Single Bar Jump

Add the `.amxd` device to a Live Set. In Key Map Mode, map **Back** to the
comma key (`,`) and **Forward** to the period key (`.`). Live's acceptance of
punctuation assignments can depend on the keyboard layout; comma and period
were confirmed working in the user's Live setup. The device does not install
these assignments automatically. Version 0.0.4 was confirmed working in Live.
It follows the mapped-button pattern used by the other working devices: each
button emits on both value transitions, so repeated keypresses work regardless
of whether its oval indicator is lit.

Each press moves both the Arrangement Scrub Area
(`Song.current_song_time`) and Play Start Indicator (`Song.start_time`) by one
bar in the selected direction. Bar length is calculated from Live's current
time signature as `signature_numerator * 4 / signature_denominator` beats.
Backward movement clamps each position at beat 0. Forward movement is not
clamped to the last event, so it can move into empty Arrangement space. The
Scrub Area uses Live's documented `Song.jump_by` function; the Play Start
Indicator uses `Song.start_time`. The device does not start or stop playback.
It logs the requested Scrub Area jump, current position readback, resulting
Play Start Indicator position, and transport state. The current position
readback may update asynchronously. The device reads the Song time-signature
properties when triggered; behavior across Arrangement time-signature changes
has not yet been verified.

Diagnostics use the `Single-Bar-Jump:` prefix in the Max Console, including a
script-loaded message when the device initializes and a trigger message when
either control fires. Failures are reported with `Single-Bar-Jump ERROR:`.
Keep the required `single_bar_jump.js` script beside the `.amxd` when
installing it in Live. The manifest and `.maxpat` are build inputs and are not
required in Live.

The implementation uses the documented `Song.jump_by` function and the
`Song.current_song_time`, `Song.start_time`, `Song.signature_numerator`, and
`Song.signature_denominator` properties from Cycling '74's
[Song API](https://docs.cycling74.com/apiref/lom/song/). Live's
[Key Remote Control manual](https://www.ableton.com/en/live-manual/12/midi-and-key-remote-control/)
documents computer-key mappings. Since punctuation-key support may vary by
keyboard layout, verify the mappings if using a different layout.
