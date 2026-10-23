autowatch = 1;
inlets = 1;
outlets = 0;

var POSITION_TOLERANCE = 0.000001;

function loadbang() {
    post(
        "Locators-Markers-Create-Navigate: v0.0.3 loaded; " +
            "Create, Previous, and Next controls ready\n"
    );
}

function msg_int(action) {
    if (action !== -1 && action !== 0 && action !== 1) {
        post(
            "Locators-Markers-Create-Navigate ERROR: invalid action ",
            action,
            " (expected -1, 0, or 1)\n"
        );
        return;
    }

    try {
        var song = new LiveAPI(apiCallback, "live_set");
        requireLiveObject(song, "Live Set");
        var wasPlaying = numericValue(song.get("is_playing"), "is_playing");
        if (wasPlaying !== 0 && wasPlaying !== 1) {
            throw new Error("Unexpected is_playing value: " + wasPlaying);
        }

        if (action === 0) {
            toggleLocator(song, wasPlaying);
            return;
        }

        navigateLocator(song, action, wasPlaying);
    } catch (error) {
        post("Locators-Markers-Create-Navigate ERROR: ", error.message, "\n");
    }
}

function toggleLocator(song, wasPlaying) {
    var beforeCount = song.getcount("cue_points");
    var position = numericValue(
        song.get("current_song_time"),
        "current_song_time"
    );
    post(
        "Locators-Markers-Create-Navigate: Set/Delete Locator trigger; " +
            "Arrangement position=",
        position,
        " beat(s), locator count before=",
        beforeCount,
        ", transport=",
        wasPlaying === 1 ? "playing" : "stopped",
        "\n"
    );

    song.call("set_or_delete_cue");

    var afterCount = song.getcount("cue_points");
    verifyTransport(song, wasPlaying);
    post(
        "Locators-Markers-Create-Navigate: Set/Delete Locator API call " +
            "completed; locator count after=",
        afterCount,
        "; transport remains ",
        wasPlaying === 1 ? "playing" : "stopped",
        "\n"
    );
}

function navigateLocator(song, direction, wasPlaying) {
    var currentPosition = numericValue(
        song.get("current_song_time"),
        "current_song_time"
    );
    var cuePointCount = song.getcount("cue_points");
    var targetPosition = findAdjacentLocator(
        cuePointCount,
        currentPosition,
        direction
    );
    var currentStartPosition = numericValue(song.get("start_time"), "start_time");
    var directionName = direction < 0 ? "previous" : "next";

    post(
        "Locators-Markers-Create-Navigate: ",
        directionName,
        " locator trigger; current Arrangement position=",
        currentPosition,
        " beat(s), locator count=",
        cuePointCount,
        ", Play Start Indicator=",
        currentStartPosition,
        " beat(s)",
        "\n"
    );

    if (targetPosition === null) {
        post(
            "Locators-Markers-Create-Navigate: no ",
            directionName,
            " locator exists from the current position; no action taken\n"
        );
        return;
    }
    var shouldMoveCursor =
        Math.abs(targetPosition - currentPosition) > POSITION_TOLERANCE;
    var shouldMovePlayStart =
        Math.abs(targetPosition - currentStartPosition) > POSITION_TOLERANCE;
    if (!shouldMoveCursor && !shouldMovePlayStart) {
        post(
            "Locators-Markers-Create-Navigate: cursor and Play Start Indicator " +
                "are already at the ",
            directionName,
            " locator position ",
            targetPosition,
            " beat(s); no action taken\n"
        );
        return;
    }

    if (shouldMovePlayStart) {
        post(
            "Locators-Markers-Create-Navigate: setting Play Start Indicator ",
            currentStartPosition,
            " -> ",
            targetPosition,
            " beat(s)\n"
        );
        song.set("start_time", targetPosition);
    }
    if (shouldMoveCursor) {
        song.set("current_song_time", targetPosition);
    }
    var resultingStartPosition = numericValue(
        song.get("start_time"),
        "start_time after set"
    );
    if (Math.abs(resultingStartPosition - targetPosition) > POSITION_TOLERANCE) {
        throw new Error(
            "Live did not move the Play Start Indicator to " +
                targetPosition +
                " beats (read back " +
                resultingStartPosition +
                " beats)"
        );
    }
    var resultingPosition = numericValue(
        song.get("current_song_time"),
        "current_song_time after set"
    );
    verifyTransport(song, wasPlaying);

    post(
        "Locators-Markers-Create-Navigate: requested ",
        directionName,
        " locator at ",
        targetPosition,
        " beat(s); Play Start Indicator=",
        resultingStartPosition,
        " beat(s), immediate current_song_time readback=",
        resultingPosition,
        " beat(s); transport remains ",
        wasPlaying === 1 ? "playing" : "stopped",
        wasPlaying === 1
            ? " (Live may update playback position asynchronously)"
            : "",
        "\n"
    );
}

function findAdjacentLocator(cuePointCount, currentPosition, direction) {
    var candidate = null;
    for (var i = 0; i < cuePointCount; i++) {
        var cuePoint = new LiveAPI(apiCallback, "live_set cue_points " + i);
        requireLiveObject(cuePoint, "Locator " + i);
        var locatorPosition = numericValue(cuePoint.get("time"), "locator time");
        var isBefore = locatorPosition < currentPosition - POSITION_TOLERANCE;
        var isAfter = locatorPosition > currentPosition + POSITION_TOLERANCE;

        if (direction < 0 && isBefore) {
            if (candidate === null || locatorPosition > candidate) {
                candidate = locatorPosition;
            }
        } else if (direction > 0 && isAfter) {
            if (candidate === null || locatorPosition < candidate) {
                candidate = locatorPosition;
            }
        }
    }
    return candidate;
}

function verifyTransport(song, wasPlaying) {
    var isPlaying = numericValue(song.get("is_playing"), "is_playing after action");
    if (isPlaying !== wasPlaying) {
        throw new Error(
            "Transport state changed unexpectedly (was " +
                wasPlaying +
                ", now " +
                isPlaying +
                ")"
        );
    }
}

function apiCallback() {}

function requireLiveObject(api, label) {
    var id = api ? Number(api.id) : NaN;
    if (!isFinite(id) || id === 0) {
        throw new Error(
            label +
                " is unavailable (id=" +
                (api ? api.id : "unavailable") +
                ", path=" +
                (api ? api.path : "unavailable") +
                ")"
        );
    }
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
