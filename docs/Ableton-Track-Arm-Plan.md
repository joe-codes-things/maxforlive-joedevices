# Ableton Track Arm-on-Selection Plan

## Goal

Build a Max for Live device that automatically arms an eligible track when it
becomes the selected track in Ableton Live 12.3.5.

## Proposed approach

1. Build a small Max for Live device and save it as an `.amxd` file in the
   Ableton User Library. A device on the Master track, such as an audio effect,
   is one possible location to evaluate. Confirm that this is suitable for the
   user's Set and does not alter its audio path before choosing it.
2. Use the Live API path `live_set view selected_track` to track the currently
   selected track. The `live.path` object can report when the object at this
   path changes.
3. When selection changes, check the selected track's `can_be_armed` property.
   If it can be armed and is not already armed, set its `arm` property to `1`.
4. Defer the state change out of the selection notification, since Live API
   changes cannot be made directly while handling a notification. Use
   `deferlow` as appropriate.
5. Test in Live 12.3.5 before relying on the device.

## Validation cases

- Select different MIDI and audio tracks and confirm the selected eligible
  track arms.
- Select tracks by clicking different areas of their track headers.
- Try rapid changes of selection and check that the final selected track is
  the one armed.
- Confirm unarmable tracks, such as the Master and Return tracks, do not cause
  errors or unintended state changes.
- Check whether arming a selected track leaves other tracks armed. Do not add
  behavior that disarms other tracks unless it is explicitly wanted and tested.
- Confirm the device remains active in the Set and does not affect audio.

## Open design point

Determine whether the device should only arm the selected track or also disarm
previously armed tracks. The initial implementation should avoid changing other
tracks' arm states unless testing and user preference establish that behavior.

## References

- [Ableton Live 12 Manual: Max for Live](https://www.ableton.com/en/live-manual/12/max-for-live/)
- [Cycling '74: Live API Overview](https://docs.cycling74.com/userguide/m4l/live_api_overview/)
- [Cycling '74: Song.View](https://docs.cycling74.com/apiref/lom/song_view/)
- [Cycling '74: Track](https://docs.cycling74.com/apiref/lom/track/)
