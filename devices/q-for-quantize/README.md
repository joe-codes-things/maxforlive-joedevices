# Q for Quantize

Q for Quantize v0.0.6 is the completed, Live-tested implementation of F010.
Open a MIDI clip in Live's Detail View, select the notes to quantize, and map
the device's **Quantize** button to lowercase `q` in Key Map Mode. Pressing the
mapped key snaps only the selected notes' start times to the active clip grid.
Note lengths and unselected notes are left unchanged.

Use the Note Length device or Live's grid controls to choose the grid. The
device supports MIDI clips shown in Detail View, including Arrangement clips;
it does not change or invoke the built-in Transform panel. If no MIDI clip or
no selected notes are available, it makes no note changes.

Turn off Computer MIDI Keyboard (Musical Typing) if it intercepts `q`. Map
only the device's momentary **Quantize** button in Key Map Mode.

When installing, copy the `.amxd` and its required `q_for_quantize.js` script
together into Live's User Library. The manifest and `.maxpat` are build inputs
and are not required in Live.
