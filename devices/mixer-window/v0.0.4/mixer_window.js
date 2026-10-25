autowatch = 1;
inlets = 1;
outlets = 2;

var apiReady = false;
var pendingRefresh = false;
var refreshTask = new Task(refresh, this);
var scanTask = new Task(scanNextTrack, this);
var stateTask = new Task(updateTrackStates, this);
var trackPaths = [];
var tracks = [];
var scanIndex = 0;
var dbCeilingCache = {};
var stateRefreshInterval = 50;
var stateErrors = {};

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
    stateTask.cancel();
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
        stateTask.schedule(stateRefreshInterval);
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
        var panParameter = new LiveAPI(null, path + " mixer_device panning");
        var hasPan = panParameter.id !== 0;

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
        var isRegularTrack = path.indexOf("return_tracks") === -1 && !isMaster;
        var routingOptions = isRegularTrack
            ? {
                inputTypes: routingOptionsFor(
                    track.get("available_input_routing_types"),
                    "available_input_routing_types"
                ),
                inputChannels: routingOptionsFor(
                    track.get("available_input_routing_channels"),
                    "available_input_routing_channels"
                ),
                outputTypes: routingOptionsFor(
                    track.get("available_output_routing_types"),
                    "available_output_routing_types"
                ),
                outputChannels: routingOptionsFor(
                    track.get("available_output_routing_channels"),
                    "available_output_routing_channels"
                )
            }
            : emptyRoutingOptions();
        var inputType = isRegularTrack
            ? routingFieldLabel(track.get("input_routing_type"))
            : "-";
        var inputChannel = isRegularTrack
            ? routingFieldLabel(track.get("input_routing_channel"))
            : "-";
        var outputType = isMaster
            ? "-"
            : routingFieldLabel(track.get("output_routing_type"));
        var outputChannel = isMaster
            ? "Master Out"
            : routingFieldLabel(track.get("output_routing_channel"));

        var record = {
            path: path,
            id: track.id,
            api: track,
            volumeApi: parameter,
            panApi: panParameter,
            name: cleanTrackName(track.getstring("name")),
            value: value,
            minimum: minimum,
            maximum: maximum,
            displayValue: displayText(displayValue),
            panMinimum: hasPan
                ? numberValue(panParameter.get("min"), "panning min")
                : 0,
            panMaximum: hasPan
                ? numberValue(panParameter.get("max"), "panning max")
                : 1,
            panValue: hasPan
                ? numberValue(panParameter.get("value"), "panning value")
                : 0.5,
            panDisplayValue: hasPan
                ? plainDisplayText(panParameter.getstring("display_value"))
                : "-",
            hasPan: hasPan,
            input: input,
            output: output,
            inputType: inputType,
            inputChannel: inputChannel,
            outputType: outputType,
            outputChannel: outputChannel,
            isMaster: isMaster,
            isSelected: booleanValue(
                track.get("is_part_of_selection"),
                "track selection"
            ),
            color: numberValue(track.get("color"), "track color"),
            meterLeft: optionalMeterValue(track, "output_meter_left", track.id),
            meterRight: optionalMeterValue(track, "output_meter_right", track.id),
            routingOptions: routingOptions
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

function updateTrackStates() {
    var i;
    for (i = 0; i < tracks.length; i++) {
        var record = tracks[i];
        if (!record) {
            continue;
        }

        try {
            if (!record.api || record.api.id === 0 || record.api.id !== record.id) {
                throw new Error("Track is no longer available");
            }
            record.value = numberValue(
                record.volumeApi.get("value"),
                "volume value"
            );
            record.displayValue = displayText(
                record.volumeApi.getstring("display_value")
            );
            if (record.hasPan) {
                record.panValue = numberValue(
                    record.panApi.get("value"),
                    "panning value"
                );
                record.panDisplayValue = plainDisplayText(
                    record.panApi.getstring("display_value")
                );
            }
            record.isSelected = booleanValue(
                record.api.get("is_part_of_selection"),
                "track selection"
            );
            record.color = numberValue(record.api.get("color"), "track color");
            record.meterLeft = optionalMeterValue(
                record.api,
                "output_meter_left",
                record.id
            );
            record.meterRight = optionalMeterValue(
                record.api,
                "output_meter_right",
                record.id
            );
            delete stateErrors[record.id];
            sendTrackState(i, record);
        } catch (error) {
            if (!stateErrors[record.id]) {
                post(
                    "Mixer-Window ERROR: state refresh failed for ",
                    record.name,
                    ": ",
                    error.message,
                    "\n"
                );
                stateErrors[record.id] = true;
            }
        }
    }
    stateTask.schedule(stateRefreshInterval);
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
        if (record.api.id === 0 || record.api.id !== record.id) {
            post(
                "Mixer-Window: channel changed before fader update; refreshing\n"
            );
            refresh();
            return;
        }

        var target = record.minimum
            + normalized * (record.maximum - record.minimum);
        record.volumeApi.set("value", target);
        record.value = target;
        record.displayValue = displayText(
            record.volumeApi.call("str_for_value", target)
        );
        sendTrackState(trackIndex, record);
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

function pan(index, normalizedValue) {
    var trackIndex = integerValue(index, "track index");
    var normalized = Math.max(
        0,
        Math.min(1, numberValue(normalizedValue, "panning value"))
    );
    var record = tracks[trackIndex];
    if (!record || record.isMaster) {
        post("Mixer-Window ERROR: panning is unavailable for this channel\n");
        return;
    }

    try {
        if (record.api.id === 0 || record.api.id !== record.id) {
            refresh();
            return;
        }
        var target = record.panMinimum
            + normalized * (record.panMaximum - record.panMinimum);
        record.panApi.set("value", target);
        record.panValue = target;
        record.panDisplayValue = plainDisplayText(
            record.panApi.call("str_for_value", target)
        );
        sendTrackState(trackIndex, record);
    } catch (error) {
        post("Mixer-Window ERROR: panning update failed: ", error.message, "\n");
    }
}

function route(index, direction, kind, optionIndex) {
    var trackIndex = integerValue(index, "track index");
    var selectedIndex = integerValue(optionIndex, "routing option");
    var record = tracks[trackIndex];
    if (!record || record.isMaster || !record.api) {
        post("Mixer-Window ERROR: routing is unavailable for this channel\n");
        return;
    }
    if (direction !== "input" && direction !== "output") {
        throw new Error("Invalid routing direction");
    }
    if (kind !== "type" && kind !== "channel") {
        throw new Error("Invalid routing kind");
    }

    var options = record.routingOptions[direction + kind.charAt(0).toUpperCase()
        + kind.slice(1) + "s"];
    if (!options || !options[selectedIndex]) {
        post("Mixer-Window ERROR: routing choice is no longer available\n");
        refresh();
        return;
    }

    var property = direction + "_routing_" + kind;
    try {
        if (record.api.id === 0 || record.api.id !== record.id) {
            refresh();
            return;
        }
        record.api.set(property, options[selectedIndex].identifier);
        post(
            "Mixer-Window: set ",
            record.name,
            " ",
            property,
            " to ",
            options[selectedIndex].display_name,
            "\n"
        );
        refresh();
    } catch (error) {
        post("Mixer-Window ERROR: routing update failed: ", error.message, "\n");
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
        var type = routingFieldLabel(track.get(direction + "_routing_type"));
        var channel = routingFieldLabel(
            track.get(direction + "_routing_channel")
        );
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

function routingFieldLabel(value) {
    return dictionaryField(value, "display_name") || "Unavailable";
}

function routingOptionsFor(value, propertyName) {
    var valueRoot = dictionaryValue(value, propertyName, 0);
    var source = valueRoot !== null ? valueRoot : value;
    var options = [];
    collectRoutingOptions(source, options, 0);
    var unique = [];
    var seen = {};
    var i;
    for (i = 0; i < options.length; i++) {
        var option = options[i];
        if (!option.identifier || !option.display_name) {
            continue;
        }
        if (!Object.prototype.hasOwnProperty.call(seen, option.identifier)) {
            seen[option.identifier] = true;
            unique.push(option);
        }
    }
    return unique;
}

function dictionaryValue(value, key, depth) {
    if (depth > 8 || value === null || value === undefined) {
        return null;
    }
    value = parseStructured(value);
    if (isArray(value)) {
        var i;
        for (i = 0; i < value.length - 1; i++) {
            if (String(value[i]) === key) {
                return value[i + 1];
            }
        }
        for (i = 0; i < value.length; i++) {
            if (
                typeof value[i] === "object"
                || (
                    (typeof value[i] === "string" || value[i] instanceof String)
                    && /^[\[{]/.test(String(value[i]))
                )
            ) {
                var arrayValue = dictionaryValue(value[i], key, depth + 1);
                if (arrayValue !== null) {
                    return arrayValue;
                }
            }
        }
        return null;
    }
    if (typeof value === "object") {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
            return value[key];
        }
        for (var property in value) {
            if (Object.prototype.hasOwnProperty.call(value, property)) {
                var objectValue = dictionaryValue(
                    value[property],
                    key,
                    depth + 1
                );
                if (objectValue !== null) {
                    return objectValue;
                }
            }
        }
    }
    return null;
}

function collectRoutingOptions(value, options, depth) {
    if (depth > 8 || value === null || value === undefined) {
        return;
    }
    value = parseStructured(value);

    if (isArray(value)) {
        var dictionaryOption = dictionaryOptionFromArray(value);
        if (dictionaryOption) {
            options.push(dictionaryOption);
            return;
        }
        var i;
        for (i = 0; i < value.length; i++) {
            collectRoutingOptions(value[i], options, depth + 1);
        }
        return;
    }

    if (typeof value === "object") {
        if (value.display_name && value.identifier) {
            options.push({
                display_name: String(value.display_name),
                identifier: String(value.identifier)
            });
            return;
        }
        for (var key in value) {
            if (Object.prototype.hasOwnProperty.call(value, key)) {
                collectRoutingOptions(value[key], options, depth + 1);
            }
        }
    }
}

function dictionaryOptionFromArray(value) {
    var displayName = "";
    var identifier = "";
    var i;
    for (i = 0; i < value.length - 1; i++) {
        if (String(value[i]) === "display_name") {
            displayName = String(value[i + 1]);
        } else if (String(value[i]) === "identifier") {
            identifier = String(value[i + 1]);
        }
    }
    return displayName && identifier
        ? {display_name: displayName, identifier: identifier}
        : null;
}

function parseStructured(value) {
    if (typeof value !== "string" && !(value instanceof String)) {
        return value;
    }
    var text = String(value);
    if (!/^[\[{]/.test(text)) {
        return value;
    }
    try {
        return JSON.parse(text);
    } catch (error) {
        return value;
    }
}

function emptyRoutingOptions() {
    return {
        inputTypes: [],
        inputChannels: [],
        outputTypes: [],
        outputChannels: []
    };
}

function cleanTrackName(value) {
    var name = textValue(value, "track name");
    if (name.length >= 2 && name.charAt(0) === "\"" && name.charAt(name.length - 1) === "\"") {
        try {
            var parsed = JSON.parse(name);
            if (typeof parsed === "string") {
                return parsed;
            }
        } catch (error) {
            return name.substring(1, name.length - 1);
        }
    }
    return name;
}

function optionalMeterValue(track, property, trackId) {
    try {
        return meterValue(track.get(property));
    } catch (error) {
        var errorKey = trackId + ":" + property;
        if (!stateErrors[errorKey]) {
            post(
                "Mixer-Window: ",
                property,
                " unavailable for track ",
                trackId,
                ": ",
                error.message,
                "\n"
            );
            stateErrors[errorKey] = true;
        }
        return 0;
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
        record.isMaster ? 1 : 0,
        encodeURIComponent(JSON.stringify({
            pan: normalizedPan(record),
            panDisplayValue: record.panDisplayValue,
            isSelected: record.isSelected,
            color: record.color,
            meterLeft: record.meterLeft,
            meterRight: record.meterRight,
            inputType: record.inputType,
            inputChannel: record.inputChannel,
            outputType: record.outputType,
            outputChannel: record.outputChannel,
            hasPan: record.hasPan,
            routingOptions: record.routingOptions
        }))
    );
}

function sendTrackState(index, record) {
    outlet(
        0,
        "state",
        index,
        normalizedValue(record.value, record.minimum, record.maximum),
        encodeURIComponent(record.displayValue),
        normalizedPan(record),
        encodeURIComponent(record.panDisplayValue),
        record.meterLeft,
        record.meterRight,
        record.isSelected ? 1 : 0,
        record.color
    );
}

function normalizedValue(value, minimum, maximum) {
    return Math.max(0, Math.min(1, (value - minimum) / (maximum - minimum)));
}

function normalizedPan(record) {
    return Math.max(
        0,
        Math.min(
            1,
            (record.panValue - record.panMinimum)
                / (record.panMaximum - record.panMinimum)
        )
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

function plainDisplayText(value) {
    var text = textValue(value, "parameter display value");
    if (
        text.length >= 2
        && text.charAt(0) === "\""
        && text.charAt(text.length - 1) === "\""
    ) {
        try {
            text = JSON.parse(text);
        } catch (error) {
            text = text.substring(1, text.length - 1);
        }
    }
    return text || "-";
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

function booleanValue(value, description) {
    if (isArray(value) && value.length === 1) {
        value = value[0];
    }
    if (value === 0 || value === false) {
        return false;
    }
    if (value === 1 || value === true) {
        return true;
    }
    throw new Error("Invalid boolean for " + description);
}

function meterValue(value) {
    var meter = numberValue(value, "output meter");
    return Math.max(0, Math.min(1, meter));
}

function isArray(value) {
    return Object.prototype.toString.call(value) === "[object Array]";
}
