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
var dbCeilingCache = {};

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
        var parameterMaximum = numberValue(
            parameter.get("max"),
            "volume max"
        );
        if (parameterMaximum <= minimum) {
            throw new Error("Invalid volume range for " + path);
        }
        var maximum = valueAtDbCeiling(
            parameter,
            minimum,
            parameterMaximum,
            0
        );

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
        record.displayValue = displayText(
            parameter.call("str_for_value", target)
        );
        outlet(
            0,
            "display",
            trackIndex,
            encodeURIComponent(record.displayValue)
        );
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
    if (isArray(result)) {
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

function dictionaryField(value, key, depth) {
    var level = depth || 0;
    if (level > 5 || value === null || value === undefined) {
        return "";
    }

    if (typeof value === "string" || value instanceof String) {
        var text = String(value);
        try {
            var parsed = JSON.parse(text);
            if (parsed !== value) {
                return dictionaryField(parsed, key, level + 1);
            }
        } catch (error) {
            var escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            var fieldPattern = new RegExp(
                "[\"']?"
                    + escapedKey
                    + "[\"']?\\s*:\\s*[\"']([^\"']+)"
            );
            var match = fieldPattern.exec(text);
            if (match) {
                return match[1];
            }
        }
        return /^[\[{]/.test(text) ? "" : text;
    }

    if (isArray(value)) {
        var i;
        for (i = 0; i < value.length - 1; i++) {
            if (String(value[i]) === key) {
                return dictionaryField(value[i + 1], key, level + 1);
            }
        }
        for (i = 0; i < value.length; i++) {
            var item = value[i];
            if (
                item
                && (
                    typeof item === "object"
                    || (
                        (typeof item === "string" || item instanceof String)
                        && /^[\[{]/.test(String(item))
                    )
                )
            ) {
                var structuredResult = dictionaryField(item, key, level + 1);
                if (structuredResult) {
                    return structuredResult;
                }
            }
        }
        for (i = 0; i < value.length; i++) {
            var plainText = String(value[i]);
            if (
                (typeof value[i] === "string" || value[i] instanceof String)
                && !/^[\[{]/.test(plainText)
                && !/^[a-z_]+_routing_(?:type|channel)$/i.test(plainText)
            ) {
                return plainText;
            }
        }
        return "";
    }

    if (typeof value === "object") {
        if (value[key] !== undefined && value[key] !== null) {
            return dictionaryField(value[key], key, level + 1)
                || String(value[key]);
        }
        if (value.display_name !== undefined && key === "display_name") {
            return String(value.display_name);
        }
        for (var property in value) {
            if (Object.prototype.hasOwnProperty.call(value, property)) {
                var objectResult = dictionaryField(
                    value[property],
                    key,
                    level + 1
                );
                if (objectResult) {
                    return objectResult;
                }
            }
        }
    }
    return "";
}

function sendTrack(index, record) {
    var normalized = Math.max(
        0,
        Math.min(
            1,
            (record.value - record.minimum)
                / (record.maximum - record.minimum)
        )
    );
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
    if (isArray(value)) {
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
    if (isArray(value)) {
        var i;
        for (i = value.length - 1; i >= 0; i--) {
            if (
                typeof value[i] === "string"
                || typeof value[i] === "number"
            ) {
                value = value[i];
                break;
            }
        }
        if (i < 0) {
            return "-";
        }
    }
    if (typeof value === "number" && isFinite(value)) {
        return value.toFixed(2) + " dB";
    }
    if (
        (typeof value === "string" || value instanceof String)
        && String(value).length > 0
    ) {
        var text = String(value);
        var match = /[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/i.exec(text);
        if (match) {
            return Number(match[0]).toFixed(2) + " dB";
        }
        if (/[-+]?inf(?:inity)?/i.test(text)) {
            return text.charAt(0) === "-" ? "-inf dB" : "inf dB";
        }
    }
    return "-";
}

function valueAtDbCeiling(parameter, minimum, maximum, ceilingDb) {
    var cacheKey = [minimum, maximum, ceilingDb].join(":");
    if (Object.prototype.hasOwnProperty.call(dbCeilingCache, cacheKey)) {
        return dbCeilingCache[cacheKey];
    }

    var minimumDb = displayDbForValue(parameter, minimum);
    var maximumDb = displayDbForValue(parameter, maximum);
    if (minimumDb > ceilingDb) {
        throw new Error("Volume parameter minimum is above the dB ceiling");
    }
    if (maximumDb <= ceilingDb) {
        dbCeilingCache[cacheKey] = maximum;
        return maximum;
    }

    var lower = minimum;
    var upper = maximum;
    var iteration;
    for (iteration = 0; iteration < 24; iteration++) {
        var midpoint = (lower + upper) / 2;
        if (displayDbForValue(parameter, midpoint) <= ceilingDb) {
            lower = midpoint;
        } else {
            upper = midpoint;
        }
    }
    dbCeilingCache[cacheKey] = lower;
    return lower;
}

function displayDbForValue(parameter, value) {
    var result = parameter.call("str_for_value", value);
    var formatted = displayText(result);
    if (formatted === "-") {
        throw new Error("Live returned an invalid volume display value");
    }
    if (formatted === "-inf dB") {
        return -Infinity;
    }
    var match = /[-+]?(?:\d+\.?\d*|\.\d+)/.exec(formatted);
    if (!match) {
        throw new Error("Live returned a non-numeric volume display value");
    }
    return Number(match[0]);
}

function numberValue(value, description) {
    if (isArray(value)) {
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

function isArray(value) {
    return Object.prototype.toString.call(value) === "[object Array]";
}
