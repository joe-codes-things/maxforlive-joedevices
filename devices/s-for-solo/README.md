# S for Solo

Turn off Live's **Computer MIDI Keyboard** (also called Musical Typing), then
add the `.amxd` device to a Live Set and map the device's **Solo** control to
lowercase `s` in Key Map Mode.

The v0.0.6 build has a minimal UI with the Solo control and setup reminder.
The user previously confirmed the shortcut works for both single and multiple
selected tracks after disabling Computer MIDI Keyboard. A later report found
that in v0.0.5 and v0.0.6, Solo did not work as expected while the mapped
device remained loaded; removing the device restored Solo behavior. The cause
is unknown. To help distinguish key-mapping conflicts from button behavior,
test whether unmapping `s` restores Solo while leaving the device loaded, and
whether clicking the device's Solo button works consistently. Do not assume
either possible cause without testing.
