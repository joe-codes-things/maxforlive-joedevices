# S for Solo

Turn off Live's **Computer MIDI Keyboard** (also called Musical Typing), then
add the `.amxd` device to a Live Set and map the device's **Solo** control to
lowercase `s` in Key Map Mode.

The v0.0.6 build has a minimal UI with the Solo control and setup reminder.
The user previously confirmed the shortcut works for both single and multiple
selected tracks after disabling Computer MIDI Keyboard. During later testing,
the user found that unarming all devices across the project was necessary for
S for Solo to work as expected. No device code change was needed; see the
resolved B004 entry in [`docs/BUGS.md`](../../docs/BUGS.md).
