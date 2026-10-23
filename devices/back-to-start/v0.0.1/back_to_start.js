autowatch = 1;
inlets = 1;
outlets = 0;

var ARRANGEMENT_START = 0;
var POSITION_TOLERANCE = 0.000001;

function bang() {
    moveToArrangementStart();
}

function msg_int(value) {
    if (value !== 0) {
        moveToArrangementStart();
    }
}

function moveToArrangementStart() {
    post("Back-to-Start: trigger received\n");

    try {
        var song = new LiveAPI(apiCallback, "live_set");
        requireLiveObject(song, "Live Set");

        var wasPlaying = numericValue(song.get("is_playing"), "is_playing");
        if (wasPlaying !== 0 && wasPlaying !== 1) {
            throw new Error("Unexpected is_playing value: " + wasPlaying);
        }

        var currentPosition = numericValue(
            song.get("current_song_time"),
            "current_song_time"
        );
        var detailClipId = getDetailClipId();
        if (detailClipId !== 0) {
            logDetailClip(detailClipId);
        } else {
            post("Back-to-Start: no clip is open in Detail View\n");
        }

        if (
            wasPlaying === 0 &&
            Math.abs(currentPosition - ARRANGEMENT_START) <= POSITION_TOLERANCE
        ) {
            post("Back-to-Start: Arrangement position is already at bar 1\n");
            return;
        }

        post(
            "Back-to-Start: setting current_song_time ",
            currentPosition,
            " -> ",
            ARRANGEMENT_START,
            " beat(s); transport was ",
            wasPlaying === 1 ? "playing" : "stopped",
            "\n"
        );
        song.set("current_song_time", ARRANGEMENT_START);

        var resultingPosition = numericValue(
            song.get("current_song_time"),
            "current_song_time after set"
        );
        var isPlaying = numericValue(song.get("is_playing"), "is_playing after set");
        if (isPlaying !== wasPlaying) {
            throw new Error(
                "Transport state changed unexpectedly (was " +
                    wasPlaying +
                    ", now " +
                    isPlaying +
                    ")"
            );
        }

        if (
            wasPlaying === 0 &&
            Math.abs(resultingPosition - ARRANGEMENT_START) > POSITION_TOLERANCE
        ) {
            throw new Error(
                "Live did not move the stopped Arrangement position to bar 1 " +
                    "(read back " +
                    resultingPosition +
                    " beats)"
            );
        }

        post(
            "Back-to-Start: verified position=",
            resultingPosition,
            " beat(s); transport remains ",
            isPlaying === 1 ? "playing" : "stopped",
            "\n"
        );
    } catch (error) {
        post("Back-to-Start ERROR: ", error.message, "\n");
    }
}

function getDetailClipId() {
    var songView = new LiveAPI(apiCallback, "live_set view");
    requireLiveObject(songView, "Song View");
    return objectId(songView.get("detail_clip"), "Song View detail_clip");
}

function logDetailClip(clipId) {
    var clip = new LiveAPI(apiCallback, "id " + clipId);
    requireLiveObject(clip, "Detail View clip");

    var clipType =
        numericValue(clip.get("is_midi_clip"), "is_midi_clip") === 1
            ? "MIDI"
            : "audio";
    var arrangementClip = numericValue(
        clip.get("is_arrangement_clip"),
        "is_arrangement_clip"
    );
    post(
        "Back-to-Start: Detail View has ",
        clipType,
        " clip id=",
        clip.id,
        " path=",
        clip.path,
        " arrangement_clip=",
        arrangementClip,
        "\n"
    );
    post(
        "Back-to-Start: v0.0.1 moves the global Arrangement position; " +
            "the documented Clip View API has no editor scroll/playhead setter\n"
    );
}

function apiCallback() {}

function requireLiveObject(api, label) {
    var id = api ? Number(api.id) : NaN;
    if (!isFinite(id) || id === 0) {
        throw new Error(
            label +
                " is not available (id=" +
                (api ? api.id : "unavailable") +
                ", path=" +
                (api ? api.path : "unavailable") +
                ")"
        );
    }
}

function objectId(value, propertyName) {
    if (isArrayValue(value)) {
        if (value.length === 1) {
            return objectId(value[0], propertyName);
        }
        if (value.length === 2 && value[0] === "id") {
            return objectId(value[1], propertyName);
        }
        if (value.length === 3 && value[1] === "id") {
            return objectId(value[2], propertyName);
        }
        throw new Error(
            "Unexpected Live object reference for " +
                propertyName +
                ": " +
                describeValue(value)
        );
    }

    if (typeof value === "string") {
        var match = value.match(/^(?:id\s+)?(\d+)$/);
        if (match) {
            value = Number(match[1]);
        }
    }

    if (typeof value !== "number" || !isFinite(value) || Math.floor(value) !== value) {
        throw new Error(
            "Invalid Live object reference for " +
                propertyName +
                ": " +
                describeValue(value)
        );
    }
    return value;
}

function numericValue(value, propertyName) {
    if (isArrayValue(value)) {
        if (value.length !== 1) {
            throw new Error("Unexpected value for " + propertyName);
        }
        value = value[0];
    }

    if (typeof value === "string" && value.trim() !== "") {
        value = Number(value);
    }
    if (typeof value !== "number" || !isFinite(value)) {
        throw new Error("Invalid numeric value for " + propertyName);
    }
    return value;
}

function isArrayValue(value) {
    return Object.prototype.toString.call(value) === "[object Array]";
}

function describeValue(value) {
    try {
        return JSON.stringify(value);
    } catch (error) {
        return String(value);
    }
}
