# Bugs

## Current bugs

### B002 — Note Length grid-selection indicators are not mutually exclusive

- **Device**: Note Length (`devices/note-length/`)
- **Status**: Open
- **Device version(s)**: v0.0.9 (indicator behavior); v0.0.10 (failed attempted fix)
- **Environment**: Ableton Live and Max for Live; exact versions and OS not
  recorded
- **Steps to reproduce**: In v0.0.9, press one mapped grid key and then a
  different mapped grid key. Observe the device's six oval indicators.
- **Expected behavior**: Only the oval for the most recently selected grid
  division is lit, while all six keys continue to change the grid when pressed.
- **Actual behavior**: The controls toggle independently, so more than one oval
  can remain lit. In v0.0.10, an attempted silent UI reset-and-select update
  made the device unusable; the user reported that build as completely broken.
- **Investigation**: v0.0.10 attempted to synchronize the six parameterized
  `live.button` controls by sending silent `set` messages after a selection.
  The exact runtime failure has not been isolated. That UI-state synchronization
  approach was removed, and the source was restored to the user-confirmed
  working v0.0.9 behavior.
- **Workaround**: Use v0.0.9 for grid selection. Its grid changes work, but the
  oval indicators may not represent one exclusive active selection.

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

Assign the next available ID (`B001`, `B002`, ...). Include:

- **Title**
- **Device**
- **Status**: Open, In Progress, Fixed, or Closed
- **Device version(s)**
- **Environment**: Live and Max versions, OS, and relevant Set configuration
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **Workaround** (if any)
