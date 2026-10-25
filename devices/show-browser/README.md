# Show Browser

Add the `.amxd` device to a Live Set, then map its **Browser** button to the
`1` key on the main keyboard row in Key Map Mode. Do not map it to `1` on the
numeric keypad. Pressing the mapped key shows and focuses Live's Browser when
it is hidden; pressing it again hides the Browser.

The device uses Live's documented `Application.View` API to query whether
`Browser` is visible, call `focus_view` to show it, and call `hide_view` to
close it. It reads visibility back to verify the change. The API is documented
by Cycling '74 at
[Application.View](https://docs.cycling74.com/apiref/lom/application_view/).
The key assignment is made by the user in Live's Key Map Mode; the device does
not assign or synthesize keyboard input itself.

The user confirmed that v0.0.1 works in Live with the top-row `1` mapping and
that this key is distinct from numpad `1`.

Keep the required `show_browser.js` script beside the `.amxd` when installing
it. Diagnostics use the `Show-Browser:` prefix in the Max Console; errors are
reported with the `Show-Browser ERROR:` prefix.
