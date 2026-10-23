autowatch = 1;
inlets = 1;
outlets = 0;

var pendingBatches = [];
var processingTask = new Task(processNextTrack, this);

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

    var i;

    post("M-for-Mute: trigger received\n");

    try {
        var song = new LiveAPI(apiCallback, "live_set");
        post(
            "M-for-Mute: Live Set API id=",
            song.id,
            " path=",
            song.path,
            " valid=",
            song.valid,
            "\n"
        );
        if (song.id === 0) {
            throw new Error("Live Set API returned id 0");
        }

        for (i = 0; i < trackGroups.length; i++) {
            trackGroups[i].count = song.getcount(trackGroups[i].name);
        }

        var selectedPaths = [];
        for (i = 0; i < trackGroups.length; i++) {
            var group = trackGroups[i];
            var index;

            for (index = 0; index < group.count; index++) {
                var path = "live_set " + group.name + " " + index;
                var track = new LiveAPI(apiCallback, path);
                if (track.id === 0) {
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

                selectedPaths.push(path);
            }
        }

        if (selectedPaths.length === 0) {
            post("M-for-Mute: no selected regular or return tracks found\n");
        } else {
            pendingBatches.push({
                paths: selectedPaths,
                index: 0,
                verifyPath: null,
                expectedMute: null,
                selectedCount: selectedPaths.length,
                toggledCount: 0
            });
            post("M-for-Mute: queued ", selectedPaths.length, " selected track(s)\n");
            if (!processingTask.running) {
                processingTask.schedule(10);
            }
        }
    } catch (error) {
        post("M-for-Mute ERROR: ", error.message, "\n");
    }
}

function processNextTrack() {
    if (pendingBatches.length === 0) {
        return;
    }

    var batch = pendingBatches[0];
    try {
        if (batch.verifyPath !== null) {
            var verifyTrack = new LiveAPI(apiCallback, batch.verifyPath);
            var actualMute = numericValue(verifyTrack.get("mute"), "mute");
            if (actualMute === batch.expectedMute) {
                batch.toggledCount++;
                post(
                    "M-for-Mute: verified ",
                    batch.verifyPath,
                    " mute=",
                    actualMute,
                    "\n"
                );
            } else {
                post(
                    "M-for-Mute ERROR: ",
                    batch.verifyPath,
                    " expected mute=",
                    batch.expectedMute,
                    " but Live reports ",
                    actualMute,
                    "\n"
                );
            }
            batch.verifyPath = null;
            batch.index++;
        } else if (batch.index < batch.paths.length) {
            var path = batch.paths[batch.index];
            var track = new LiveAPI(apiCallback, path);
            if (track.id === 0) {
                throw new Error("Selected track is no longer valid: " + path);
            }

            var mute = numericValue(track.get("mute"), "mute");
            batch.expectedMute = mute === 0 ? 1 : 0;
            batch.verifyPath = path;
            track.set("mute", batch.expectedMute);
            post(
                "M-for-Mute: set ",
                path,
                " mute ",
                mute,
                " -> ",
                batch.expectedMute,
                "\n"
            );
        } else {
            post(
                "M-for-Mute: selected ",
                batch.selectedCount,
                ", verified ",
                batch.toggledCount,
                " track(s)\n"
            );
            pendingBatches.shift();
        }
    } catch (error) {
        post("M-for-Mute ERROR: ", error.message, "\n");
        pendingBatches.shift();
    }

    if (pendingBatches.length > 0) {
        processingTask.schedule(20);
    }
}

function apiCallback() {}

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
