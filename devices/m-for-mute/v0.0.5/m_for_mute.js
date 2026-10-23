autowatch = 1;
inlets = 1;
outlets = 0;

function bang() {
    toggleSelectedTracks();
}

function msg_int(value) {
    if (value !== 0) {
        toggleSelectedTracks();
    }
}

function toggleSelectedTracks() {
    var trackGroups = [
        { name: "tracks", count: 0 },
        { name: "return_tracks", count: 0 }
    ];
    var selectedCount = 0;
    var toggledCount = 0;
    var i;

    post("M-for-Mute: trigger received\n");

    try {
        var song = new LiveAPI(null, "live_set");
        if (!song.valid) {
            throw new Error("Live Set API object is not valid");
        }

        for (i = 0; i < trackGroups.length; i++) {
            trackGroups[i].count = song.getcount(trackGroups[i].name);
        }

        for (i = 0; i < trackGroups.length; i++) {
            var group = trackGroups[i];
            var index;

            for (index = 0; index < group.count; index++) {
                var path = "live_set " + group.name + " " + index;
                var track = new LiveAPI(null, path);
                if (!track.valid) {
                    post("M-for-Mute: invalid track at ", path, "\n");
                    continue;
                }

                var selected = numericValue(
                    track.get("is_part_of_selection"),
                    "is_part_of_selection"
                );
                if (selected !== 1) {
                    continue;
                }

                selectedCount++;
                var mute = numericValue(track.get("mute"), "mute");
                var nextMute = mute === 0 ? 1 : 0;
                track.set("mute", nextMute);
                toggledCount++;
                post("M-for-Mute: ", path, " mute ", mute, " -> ", nextMute, "\n");
            }
        }

        if (selectedCount === 0) {
            post("M-for-Mute: no selected regular or return tracks found\n");
        } else {
            post(
                "M-for-Mute: selected ",
                selectedCount,
                ", toggled ",
                toggledCount,
                " track(s)\n"
            );
        }
    } catch (error) {
        post("M-for-Mute ERROR: ", error.message, "\n");
    }
}

function numericValue(value, propertyName) {
    if (value instanceof Array) {
        if (value.length !== 1) {
            throw new Error("Unexpected value for " + propertyName);
        }
        value = value[0];
    }
    if (typeof value !== "number" || !isFinite(value)) {
        throw new Error("Invalid numeric value for " + propertyName);
    }
    return value;
}
