# M for Mute

Add the `.amxd` device to a Live Set, then map the device's **Mute** button
(the oval in its UI) to lowercase `m` in Key Map Mode. Do not map individual
track activators; the device button is the trigger that checks the current
selection.

Version 0.0.8 first snapshots the mute states of all selected regular and
return tracks, then applies the target states and verifies the entire
selection after all changes are sent. This avoids calculating a later
track's target from state changed by an earlier write. Multi-track toggling
has been verified for pairs and larger groups of MIDI and audio tracks.
Tracks are processed on scheduled low-priority steps. The Master track does
not expose the `mute` property and is not supported.

Keep `m_for_mute.js` beside the `.amxd` file when installing or moving the
device; the script is a required dependency. For diagnostics, open the device
in Max and watch the Max Console, then click the Mute button or press its
mapped key. The `M-for-Mute:` messages report selected tracks and each state
change: `snapshot` records the original value and target, `set` is the write,
and `verified` confirms the final Live API read-back after all writes. An
`ERROR` line means Live's reported state did not match the target or an API
operation failed. Share those messages if any selected track does not stay
in its target state.
