# Mixer Window

Mixer Window v0.0.8 opens a separate Max UI window with Live-inspired channel
strips. Each strip displays its track name, Live track color and selection
state, input and output routing selectors, a horizontal pan slider, a vertical
volume fader, track activator/Solo/Arm buttons, and a send knob for each return
track. Click a channel strip to select its track in Live. Routing menus use
Live's available choices, send the selected routing dictionary, and verify the
resulting value.

Drag the horizontal slider to pan. Its blue fill extends from center toward
the current pan position. Grab the fader nub itself to drag a volume fader;
clicks elsewhere on the strip select its track without changing its volume.
Faders are capped at 0 dB, show values to two decimal places, and return to
0 dB when the nub is double-clicked. The fader reset recognizes a second nub
click within 500 ms and within 14 px of the first; moving the nub more than
8 px while dragging cancels the pending double-click. Double-click a pan
slider to center it.
Double-click a volume readout to edit its dB value; its current text is
selected, and the caret flashes every 500 ms. Type up to two decimal places,
press Return to apply, or Escape to discard the edit. A positive entered
value is clamped to 0 dB; zero displays as `0.00 dB` rather than `-0.00 dB`.
Double-click the text again to select it all, or click within it to place the
caret. The track
activator, Solo, and Arm buttons use Live's mixer parameters and track
properties. Arm buttons currently display `R`: no separate arm-glyph image
files were found in the installed Live image resources.

Send knobs follow the Set's return tracks and write directly to each channel's
`MixerDevice.sends` parameters. If the return count exceeds the strip width,
use the small arrows above the knobs to page through the sends. Labels show
only the first letter of each return track name. Adding, deleting, or renaming
returns updates the knobs and their labels during the next channel refresh.
The horizontal
divider above the faders resizes their usable vertical area and cannot move
above the buttons or send controls.

When the mixer window is focused, Left/Right Arrow selects the previous/next
regular track. A normal click selects one track in Live. Existing multi-track
selections made in Live are reflected in the mixer, but the documented Live
Object Model does not provide a supported way for a Max for Live device to set
a multi-track selection; see [F003](../../docs/FEATURE-IDEAS.md#f003--add-multi-track-selection-from-mixer-window).
Routing menus remain open across automatic refreshes, brighten the hovered
option, and close when clicked away from or when Escape is pressed. The arrow
buttons at the bottom scroll through larger Sets.

The device refreshes channel structure and routing choices approximately every
two seconds. Track selection, colors, pan, volume, activator/Solo/Arm state,
and send values are polled with a 50 ms delay between state sweeps. Custom
output meters were removed in v0.0.7; prior meter experiments and possible
future approaches are recorded in
[`F002`](../../docs/FEATURE-IDEAS.md#f002--investigate-closer-live-mixer-meter-matching).
The user has reported reduced Live UI responsiveness while this device is
active; the possible polling/redraw bottleneck and a controlled test plan are
tracked in [B005](../../docs/BUGS.md#b005--mixer-window-reduces-live-ui-responsiveness).

The window is a custom Max UI rather than a detached copy of Live's native
mixer. The Max `jsui` API does not expose an OS resize-cursor shape setter, so
the fader divider currently retains its visual line but cannot change the
pointer to Live's resize cursor.

## Installation and diagnostics

Load the latest `.amxd` device in Live and click its button to open Mixer
Window. Keep the required `mixer_window.js` and `mixer_window_ui.js` files
beside the `.amxd`. The UI script is embedded in a subpatcher, and both scripts
are included in the version folder by the device build process.

Max Console messages use the `Mixer-Window:` prefix. Errors use
`Mixer-Window ERROR:`. Routing menu interactions produce
`Mixer-Window UI DEBUG:` and `Mixer-Window DEBUG:` messages showing the chosen
label/identifier and the routing value Live returns for verification.

## Validation still required

- Confirm the separate patcher window opens from the device in Live, resizes
  with the window, and can be moved to another display.
- Test volume/pan readback and writes for audio, MIDI, return, and Master
  channels; confirm the pan readout uses positive L/R values.
- Confirm no fader can raise a channel above 0 dB and double-clicking a fader
  sets it to 0 dB.
- Confirm the fader-nub double-click reset works within 500 ms and 14 px,
  without interfering with ordinary fader dragging.
- Edit dB values, confirm the text selects on entry and the caret flashes,
  double-click to select all, commit with Return, and discard with Escape.
  Confirm positive values set the fader to 0 dB and zero is displayed without
  a negative sign.
- Test track activator, Solo, and Arm buttons on audio, MIDI, return, and
  Master channels, including unarmable tracks.
- Add/remove/rename return tracks and verify all send knobs update and write
  the correct send parameter.
- Verify Left/Right Arrow changes selection only while the mixer window is
  focused and does not select return or Master channels.
- Change routing from each mixer selector; confirm Live actually changes the
  input/output assignment and that the device verifies the result. If it
  fails, capture both routing debug messages and any Live API error.
- Confirm clicking a strip selects that track and the selected tint is subtle.
- Confirm routing menus persist during refresh, close on click-away and Escape,
  and do not show an "Unavailable" label.
- Change track colors and selection; confirm strip colors and tint follow.
- Confirm track names with spaces display without API quoting.
- Check that volume readouts have two decimal places and that the pan and send
  fill colors are legible against Live's mixer.
- Drag the fader divider and confirm the fader area resizes.
- Add, remove, rename, and reorder tracks; confirm the displayed channels
  follow Live after refresh.
- Test large Sets for responsiveness and acceptable refresh load.
