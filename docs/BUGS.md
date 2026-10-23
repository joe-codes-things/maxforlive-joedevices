# Bugs

## Current bugs

### B004 — S for Solo key mapping interferes with Solo behavior

- **Device**: S for Solo (`devices/s-for-solo/`)
- **Status**: Open
- **Device version(s)**: v0.0.5 and v0.0.6
- **Environment**: Ableton Live and Max for Live; exact versions and OS not
  recorded
- **Steps to reproduce**: Add S for Solo to a Live Set and map lowercase `s`
  to its Solo control in Key Map Mode. Soloing does not work as expected while
  the device remains loaded. Delete the device from Device View; normal Solo
  behavior then works for both single tracks and individual tracks. The user
  reports the same behavior in a newly created and saved Set.
- **Expected behavior**: The mapped control solos the selected track, and
  Live's Solo behavior remains available as expected while the device is
  loaded.
- **Actual behavior**: The user reports Solo does not work until the device is
  deleted. After deletion, Solo works for single tracks and individual tracks.
- **Investigation**: The key mapping may be intercepting `s` while the device
  is loaded, or the mapped button's toggle-state trigger may fail to emit the
  expected action. Both v0.0.5 and v0.0.6 use a toggle-mode button whose
  trigger path selects only value `1`, ignoring value `0`; this could make
  behavior depend on button state. These are hypotheses, not confirmed causes.
  To distinguish them, test whether unmapping `s` while leaving the device
  loaded restores normal Solo behavior, and whether clicking the device's
  button manually solos the selected track consistently.
- **Workaround**: Remove the device to restore the user's reported Solo
  behavior.

### B003 — Show VST Instrument requires a newer Live version

- **Device**: Show VST Instrument (`devices/show-vst-instrument/`)
- **Status**: Open
- **Device version(s)**: v0.0.1-v0.0.4
- **Environment**: Ableton Live 12.3.5, Max for Live; macOS
- **Steps to reproduce**: Load the device on a MIDI track with a VST
  instrument and press its mapped lowercase `e` button.
- **Expected behavior**: The selected track's first VST instrument editor
  opens or closes.
- **Actual behavior**: Live 12.3.5 reports that `PluginDevice` has no
  `is_editor_open` attribute. The device cannot control the plug-in window.
- **Investigation**: The current Cycling '74 API documents the property, but
  does not specify its introduction version. An independent Max for Live
  implementation gates it on Live 12.4.3 or later. No documented per-device
  API workaround for Live 12.3.5 was found.
- **Workaround**: Update Live to 12.4.3 or later, then test v0.0.4. Do not
  consider the device working until the editor toggle is confirmed in Live.

## Bugs resolved

### B001 — Selected-track arm query stalls

- **Device**: Track Select Auto Arm
- **Status**: Resolved in v0.0.3; confirmed working by user in Live
- **Affected versions**: v0.0.1 and v0.0.2; fixed in v0.0.3
- **Environment**: Ableton Live 12.3.5, Max for Live
- **Steps to reproduce**: Load v0.0.1 on the Master track and select an audio
  or MIDI track.
- **Expected behavior**: An eligible selected track that is disarmed becomes
  armed.
- **Actual behavior**: In v0.0.1 and v0.0.2, the device did not arm the
  selected track.
- **Investigation**: The original v0.0.1 patch sends `live.object` output
  directly to numeric selectors. The response format and Live API behavior
  cannot be confirmed from the patch file alone, so the exact runtime cause is
  not yet established.
- **Fix**: v0.0.3 routes tagged or bare property responses before numeric
  checks and defers the eligibility query out of the selection notification.
- **Validation**: The user confirmed v0.0.3 works in Ableton Live.
- **Workaround**: Use v0.0.3 or a later build.

## Reporting format

Assign the next unused sequential ID (currently `B005`). Include:

- **Title**
- **Device**
- **Status**: Open, In Progress, Fixed, or Closed
- **Device version(s)**
- **Environment**: Live and Max versions, OS, and relevant Set configuration
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **Workaround** (if any)
