autowatch = 1;
inlets = 1;
outlets = 0;

var POSITION_TOLERANCE = 0.000001;

function msg_int(direction) {
    if (direction === 0) {
        return;
    }
    if (direction !== -1 && direction !== 1) {
        post("Single-Bar-Jump ERROR: direction must be -1 or 1\n");
        return;
    }
    moveByOneBar(direction);
}

function moveByOneBar(direction) {
    post(
        "Single-Bar-Jump: ",
        direction < 0 ? "back" : "forward",
        " trigger received\n"
    );

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
        var playStartPosition = numericValue(
            song.get("start_time"),
            "start_time"
        );
        var numerator = integerValue(
            song.get("signature_numerator"),
            "signature_numerator"
        );
        var denominator = integerValue(
            song.get("signature_denominator"),
            "signature_denominator"
        );
        if (numerator <= 0 || denominator <= 0) {
            throw new Error(
                "Invalid time signature: " + numerator + "/" + denominator
            );
        }

        var barLength = (numerator * 4) / denominator;
        var currentTarget = Math.max(
            0,
            currentPosition + direction * barLength
        );
        var playStartTarget = Math.max(
            0,
            playStartPosition + direction * barLength
        );

        post(
            "Single-Bar-Jump: time signature=",
            numerator,
            "/",
            denominator,
            ", bar length=",
            barLength,
            " beat(s); current_song_time=",
            currentPosition,
            ", start_time=",
            playStartPosition,
            "; transport is ",
            wasPlaying === 1 ? "playing" : "stopped",
            "\n"
        );

        if (
            Math.abs(currentTarget - currentPosition) <= POSITION_TOLERANCE &&
            Math.abs(playStartTarget - playStartPosition) <= POSITION_TOLERANCE
        ) {
            post("Single-Bar-Jump: both positions are already at the start\n");
            return;
        }

        if (Math.abs(playStartTarget - playStartPosition) > POSITION_TOLERANCE) {
            song.set("start_time", playStartTarget);
        }
        if (Math.abs(currentTarget - currentPosition) > POSITION_TOLERANCE) {
            song.set("current_song_time", currentTarget);
        }

        var resultingPosition = numericValue(
            song.get("current_song_time"),
            "current_song_time after set"
        );
        var resultingPlayStart = numericValue(
            song.get("start_time"),
            "start_time after set"
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
            Math.abs(resultingPlayStart - playStartTarget) >
            POSITION_TOLERANCE
        ) {
            throw new Error(
                "Live did not move the Play Start Indicator to " +
                    playStartTarget +
                    " beats (read back " +
                    resultingPlayStart +
                    " beats)"
            );
        }
        if (
            wasPlaying === 0 &&
            Math.abs(resultingPosition - currentTarget) > POSITION_TOLERANCE
        ) {
            throw new Error(
                "Live did not move the Scrub Area to " +
                    currentTarget +
                    " beats (read back " +
                    resultingPosition +
                    " beats)"
            );
        }

        post(
            "Single-Bar-Jump: Scrub Area=",
            resultingPosition,
            " beat(s), Play Start Indicator=",
            resultingPlayStart,
            " beat(s); transport remains ",
            isPlaying === 1 ? "playing" : "stopped",
            wasPlaying === 1
                ? " (Scrub Area may advance during playback)"
                : " (both positions verified)",
            "\n"
        );
    } catch (error) {
        post("Single-Bar-Jump ERROR: ", error.message, "\n");
    }
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

function integerValue(value, propertyName) {
    var number = numericValue(value, propertyName);
    if (Math.floor(number) !== number) {
        throw new Error("Invalid integer value for " + propertyName);
    }
    return number;
}

function isArrayValue(value) {
    return Object.prototype.toString.call(value) === "[object Array]";
}
