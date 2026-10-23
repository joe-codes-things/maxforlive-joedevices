# Show Device View

Add the `.amxd` device to a Live Set, then map its **Device View** button to
lowercase `x` in Key Map Mode. Pressing `x` opens and focuses Device View when
it is not active; pressing it again hides the Detail panel. This targets
Device View directly rather than switching between Clip View and Device View.
Turn off Live's **Computer MIDI Keyboard** (Musical Typing) if it intercepts
the `x` key.

The device uses Live's documented `Application.View` API to query
`Detail/DeviceChain`, call `focus_view` to open Device View, and hide the
containing `Detail` panel when Device View is already active. It reads the
visibility back to verify the change. It does not simulate keyboard events or
depend on Live's default Option+Cmd+4 shortcut. This API is documented by
Cycling '74 at
[Application.View](https://docs.cycling74.com/apiref/lom/application_view/).

The current [Live 12 manual](https://www.ableton.com/en/live-manual/12/midi-and-key-remote-control/)
documents computer-keyboard control mappings managed by Live's Mapping Browser.
The key assignment is made in Live's Key Map Mode: this device exposes the
button but does not automatically assign `x`.

The latest build is v0.0.2. Keep its required `show_device_view.js` script
beside the `.amxd` when installing it in Live. The manifest and `.maxpat` are
build inputs and are not required in Live. Diagnostics use the
`Show-Device-View:` prefix in the Max Console; errors are reported with the
`Show-Device-View ERROR:` prefix.

Version 0.0.2 has been confirmed working in Live: it opens Device View
directly and hides the Detail panel on the next press.
