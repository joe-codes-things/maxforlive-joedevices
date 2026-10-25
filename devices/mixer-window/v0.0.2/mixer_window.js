autowatch = 1;
inlets = 1;
outlets = 2;

var apiReady = false;
var pendingRefresh = false;
var refreshTask = new Task(refresh, this);
var scanTask = new Task(scanNextTrack, this);
var trackPaths = [];
var tracks = [];
var scanIndex = 0;

function ready() {
    apiReady = true;
    post("Mixer-Window: Live API ready\n");
    if (pendingRefresh) {
        pendingRefresh = false;
        refresh();
    }
}

function open() {
    post("Mixer-Window: open trigger received\n");
    post("Mixer-Window: opening mixer window\n");
    outlet(1, "open");
    if (!apiReady) {
        pendingRefresh = true;
        post("Mixer-Window: waiting for Live API initialization\n");
        return;
    }
    refresh();
}

function bang() {
    open();
}

function refresh() {
    post("Mixer-Window: refreshing channel list\n");
    refreshTask.cancel();
    scanTask.cancel();
    if (!apiReady) {
        pendingRefresh = true;
        return;
    }

    try {
        var song = new LiveAPI(null, "live_set");
        if (song.id === 0) {
            throw new Error("Live Set API returned id 0");
        }

        trackPaths = [];
        var trackCount = count(song, "tracks");
        var returnCount = count(song, "return_tracks");
        var i;

        for (i = 0; i < trackCount; i++) {
            trackPaths.push("live_set tracks " + i);
        }
        for (i = 0; i < returnCount; i++) {
            trackPaths.push("live_set return_tracks " + i);
        }
        trackPaths.push("live_set master_track");

        tracks = new Array(trackPaths.length);
        scanIndex = 0;
        post(
            "Mixer-Window: scanning ",
            trackCount,
            " track(s), ",
            returnCount,
            " return track(s), and Master\n"
        );
        outlet(0, "begin", trackPaths.length);
        scanNextTrack();
    } catch (error) {
        post("Mixer-Window ERROR: refresh failed: ", error.message, "\n");
        refreshTask.schedule(2000);
    }
}

function scanNextTrack() {
    if (scanIndex >= trackPaths.length) {
        outlet(0, "end", trackPaths.length);
        post(
            "Mixer-Window: scan complete; displayed ",
            trackPaths.length,
            " channel(s)\n"
        );
        refreshTask.schedule(2000);
        return;
    }

    var path = trackPaths[scanIndex];
    var index = scanIndex;
    scanIndex++;

    try {
        var track = new LiveAPI(null, path);
        if (track.id === 0) {
            throw new Error("Live API returned id 0 for " + path);
        }
        var parameter = new LiveAPI(null, path + " mixer_device volume");
        if (parameter.id === 0) {
            throw new Error("Volume parameter unavailable for " + path);
        }

        var minimum = numberValue(parameter.get("min"), "volume min");
        var maximum = numberValue(parameter.get("max"), "volume max");
        if (maximum <= minimum) {
            throw new Error("Invalid volume range for " + path);
        }

        var value = numberValue(parameter.get("value"), "volume value");
        var displayValue = parameter.getstring("display_value");
        var isMaster = path === "live_set master_track";
        var input = isMaster || path.indexOf("return_tracks") !== -1
            ? "-"
            : routingLabel(track, "input");
        var output = isMaster
            ? "Master Out"
            : routingLabel(track, "output");

        var record = {
            path: path,
            id: track.id,
            name: textValue(track.getstring("name"), "track name"),
            value: value,
            minimum: minimum,
            maximum: maximum,
            displayValue: displayText(displayValue),
            input: input,
            output: output,
            isMaster: isMaster
        };
        tracks[index] = record;
        sendTrack(index, record);
    } catch (error) {
        post("Mixer-Window ERROR: ", path, ": ", error.message, "\n");
        outlet(0, "trackerror", index, encodeURIComponent("Unavailable"));
    }

    if (scanIndex < trackPaths.length) {
        scanTask.schedule(15);
    } else {
        scanNextTrack();
    }
}

function volume(index, normalizedValue) {
    var trackIndex = integerValue(index, "track index");
    var normalized = numberValue(normalizedValue, "fader value");
    normalized = Math.max(0, Math.min(1, normalized));

    var record = tracks[trackIndex];
    if (!record) {
        post("Mixer-Window ERROR: no channel at index ", trackIndex, "\n");
        refresh();
        return;
    }

    try {
        var track = new LiveAPI(null, record.path);
        if (track.id === 0 || track.id !== record.id) {
            post(
                "Mixer-Window: channel changed before fader update; refreshing\n"
            );
            refresh();
            return;
        }

        var parameter = new LiveAPI(null, record.path + " mixer_device volume");
        if (parameter.id === 0) {
            throw new Error("Volume parameter is no longer available");
        }

        var target = record.minimum
            + normalized * (record.maximum - record.minimum);
        parameter.set("value", target);
        record.value = target;
        post(
            "Mixer-Window: set ",
            record.name,
            " volume to ",
            target,
            "\n"
        );
    } catch (error) {
        post("Mixer-Window ERROR: fader update failed: ", error.message, "\n");
        refresh();
    }
}

function count(api, childName) {
    var result = api.getcount(childName);
    if (result instanceof Array) {
        if (result.length !== 1) {
            throw new Error("Unexpected count for " + childName);
        }
        result = result[0];
    }
    return integerValue(result, childName + " count");
}

function routingLabel(track, direction) {
    try {
        var typeName = direction + "_routing_type";
        var channelName = direction + "_routing_channel";
        var type = dictionaryField(track.get(typeName), "display_name");
        var channel = dictionaryField(track.get(channelName), "display_name");
        if (type && channel && type !== channel) {
            return type + " / " + channel;
        }
        return type || channel || "Unavailable";
    } catch (error) {
        post(
            "Mixer-Window ERROR: unable to read ",
            direction,
            " routing: ",
            error.message,
            "\n"
        );
        return "Unavailable";
    }
}

function dictionaryField(value, key) {
    if (value && typeof value === "object" && !(value instanceof Array)) {
        return value[key] ? String(value[key]) : "";
    }
    if (value instanceof Array) {
        var i;
        for (i = 0; i < value.length - 1; i++) {
            if (String(value[i]) === key) {
                return String(value[i + 1]);
            }
        }
        if (value.length === 1 && typeof value[0] === "string") {
            return value[0];
        }
    }
    return "";
}

function sendTrack(index, record) {
    var normalized = (record.value - record.minimum)
        / (record.maximum - record.minimum);
    outlet(
        0,
        "track",
        index,
        record.id,
        encodeURIComponent(record.name),
        normalized,
        record.minimum,
        record.maximum,
        encodeURIComponent(record.displayValue),
        encodeURIComponent(record.input),
        encodeURIComponent(record.output),
        record.isMaster ? 1 : 0
    );
}

function textValue(value, description) {
    if (value instanceof Array) {
        if (value.length !== 1) {
            throw new Error("Unexpected value for " + description);
        }
        value = value[0];
    }
    if (typeof value !== "string" && !(value instanceof String)) {
        throw new Error("Invalid value for " + description);
    }
    return String(value);
}

function displayText(value) {
    if (value instanceof Array) {
        if (value.length === 1) {
            value = value[0];
        } else if (value.length === 2 && typeof value[1] === "number") {
            value = value[1];
        } else {
            return "-";
        }
    }
    if (typeof value === "number" && isFinite(value)) {
        return value.toFixed(1) + " dB";
    }
    if (
        (typeof value === "string" || value instanceof String)
        && String(value).length > 0
    ) {
        return String(value);
    }
    return "-";
}

function numberValue(value, description) {
    if (value instanceof Array) {
        if (value.length !== 1) {
            throw new Error("Unexpected value for " + description);
        }
        value = value[0];
    }
    if (typeof value !== "number" || !isFinite(value)) {
        throw new Error("Invalid numeric value for " + description);
    }
    return value;
}

function integerValue(value, description) {
    var number = numberValue(value, description);
    if (Math.floor(number) !== number || number < 0) {
        throw new Error("Invalid integer for " + description);
    }
    return number;
}
