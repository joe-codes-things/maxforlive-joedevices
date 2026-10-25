# Show Clip View

Add the `.amxd` device to a Live Set, then map its **Clip View** button to
lowercase `z` in Key Map Mode. Pressing `z` opens and focuses Clip View when
it is not active; pressing it again hides the Detail panel. This targets Clip
View directly rather than switching between Clip View and Device View.

The device uses Live's documented `Application.View` API to query
`Detail/Clip`, call `focus_view` to open Clip View, and hide the containing
`Detail` panel when Clip View is already active. It reads visibility back to
verify the change. It does not simulate keyboard events or depend on Live's
default shortcuts. The API is documented by Cycling '74 at
[Application.View](https://docs.cycling74.com/apiref/lom/application_view/).

Live's current [keyboard-shortcut reference](https://www.ableton.com/en/live-manual/12/live-keyboard-shortcuts/)
does not list a built-in command on plain `z`; the application-specific Key Map
assignment is still made by the user. The device provides the button but does
not assign `z` automatically. If Live's Computer MIDI Keyboard (Musical
Typing) intercepts the key in your setup, turn it off before testing.

Version 0.0.1 was confirmed working by the user. Version 0.0.2 changes the
recommended Key Map Mode assignment to lowercase `z`. Keep the required
`show_clip_view.js` script beside the `.amxd` when installing it. Diagnostics
use the `Show-Clip-View:` prefix in the Max Console; errors are reported with
the `Show-Clip-View ERROR:` prefix.
