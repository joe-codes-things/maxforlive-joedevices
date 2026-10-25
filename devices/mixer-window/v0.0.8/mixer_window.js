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
var returnNames = [];
var regularTrackCount = 0;
var scanIndex = 0;
var dbCeilingCache = {};
var stateRefreshInterval = 50;
var stateErrors = {};
var pendingRoute = null;
var routeVerifyTask = new Task(verifyRoute, this);

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
        regularTrackCount = trackCount;
        returnNames = [];
        var i;

        for (i = 0; i < trackCount; i++) {
            trackPaths.push("live_set tracks " + i);
        }
        for (i = 0; i < returnCount; i++) {
            var returnPath = "live_set return_tracks " + i;
            var returnTrack = new LiveAPI(null, returnPath);
            if (returnTrack.id === 0) {
                throw new Error("Return track API unavailable for " + returnPath);
            }
            returnNames.push(cleanTrackName(returnTrack.getstring("name")));
            trackPaths.push(returnPath);
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
        outlet(0, "begin", trackPaths.length, returnCount);
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
        var isMaster = path === "live_set master_track";
        var isRegularTrack = index < regularTrackCount;
        var activatorApi = isMaster
            ? null
            : new LiveAPI(null, path + " mixer_device track_activator");
        var canToggleActivator = Boolean(activatorApi && activatorApi.id !== 0);
        var canBeArmed = isMaster
            ? false
            : optionalTrackBoolean(track, "can_be_armed", track.id);
        var sends = readSendParameters(path, isMaster);

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
        var input = isMaster || path.indexOf("return_tracks") !== -1
            ? "-"
            : routingLabel(track, "input");
        var output = isMaster
            ? "Master Out"
            : routingLabel(track, "output");
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
            isRegularTrack: isRegularTrack,
            trackNumber: isMaster ? 0 : index + 1,
            canToggleActivator: canToggleActivator,
            activatorApi: activatorApi,
            activatorMinimum: canToggleActivator
                ? numberValue(activatorApi.get("min"), "activator minimum")
                : 0,
            activatorMaximum: canToggleActivator
                ? numberValue(activatorApi.get("max"), "activator maximum")
                : 1,
            activator: canToggleActivator
                ? booleanValue(activatorApi.get("value"), "track activator")
                : false,
            solo: !isMaster
                ? optionalTrackBoolean(track, "solo", track.id)
                : false,
            canBeArmed: canBeArmed,
            arm: canBeArmed
                ? optionalTrackBoolean(track, "arm", track.id)
                : false,
            sends: sends,
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
            refreshTrackControls(record);
            refreshSendValues(record);
            record.isSelected = booleanValue(
                record.api.get("is_part_of_selection"),
                "track selection"
            );
            record.color = numberValue(record.api.get("color"), "track color");
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

function volumeDb(index, decibels) {
    var trackIndex = integerValue(index, "track index");
    var targetDb = String(decibels).toLowerCase() === "-inf"
        ? -Infinity
        : numberValue(decibels, "volume dB");
    var record = tracks[trackIndex];
    if (!record) {
        post("Mixer-Window ERROR: no channel at index ", trackIndex, "\n");
        outlet(0, "volumeEditResult", trackIndex, 0, "Track unavailable");
        return;
    }
    if (targetDb > 0) {
        post(
            "Mixer-Window: clamping typed volume ",
            targetDb,
            " dB to the 0 dB ceiling\n"
        );
        targetDb = 0;
    }

    try {
        if (record.api.id === 0 || record.api.id !== record.id) {
            throw new Error("Track changed before the dB edit was applied");
        }
        var target = valueAtDb(
            record.volumeApi,
            record.minimum,
            record.maximum,
            targetDb
        );
        record.volumeApi.set("value", target);
        record.value = target;
        record.displayValue = displayText(
            record.volumeApi.call("str_for_value", target)
        );
        sendTrackState(trackIndex, record);
        outlet(0, "volumeEditResult", trackIndex, 1, "");
        post(
            "Mixer-Window: set ",
            record.name,
            " volume to ",
            record.displayValue,
            "\n"
        );
    } catch (error) {
        post("Mixer-Window ERROR: dB edit failed: ", error.message, "\n");
        outlet(
            0,
            "volumeEditResult",
            trackIndex,
            0,
            encodeURIComponent(error.message)
        );
    }
}

function control(index, controlName) {
    var trackIndex = integerValue(index, "track index");
    var record = tracks[trackIndex];
    if (!record || record.isMaster) {
        post("Mixer-Window ERROR: track control is unavailable\n");
        return;
    }

    try {
        if (record.api.id === 0 || record.api.id !== record.id) {
            throw new Error("Track changed before its control was toggled");
        }
        if (controlName === "activator" && record.canToggleActivator) {
            var nextActivator = !record.activator;
            record.activatorApi.set(
                "value",
                nextActivator ? record.activatorMaximum : record.activatorMinimum
            );
        } else if (controlName === "solo") {
            record.api.set("solo", record.solo ? 0 : 1);
        } else if (controlName === "arm" && record.canBeArmed) {
            record.api.set("arm", record.arm ? 0 : 1);
        } else {
            post(
                "Mixer-Window ERROR: ",
                controlName,
                " is unavailable for ",
                record.name,
                "\n"
            );
            return;
        }
        refreshTrackControls(record);
        sendTrackState(trackIndex, record);
        post(
            "Mixer-Window: toggled ",
            controlName,
            " for ",
            record.name,
            "\n"
        );
    } catch (error) {
        post(
            "Mixer-Window ERROR: ",
            controlName,
            " toggle failed: ",
            error.message,
            "\n"
        );
    }
}

function send(index, sendIndex, normalizedValue) {
    var trackIndex = integerValue(index, "track index");
    var parameterIndex = integerValue(sendIndex, "send index");
    var normalized = Math.max(
        0,
        Math.min(1, numberValue(normalizedValue, "send value"))
    );
    var record = tracks[trackIndex];
    var parameter = record && record.sends[parameterIndex];
    if (!record || !parameter) {
        post("Mixer-Window ERROR: send control is unavailable\n");
        return;
    }

    try {
        if (
            record.api.id === 0
            || record.api.id !== record.id
            || !parameter.api
            || parameter.api.id === 0
            || parameter.api.id !== parameter.id
        ) {
            throw new Error("Track or send changed before the send update");
        }
        var target = parameter.minimum
            + normalized * (parameter.maximum - parameter.minimum);
        parameter.api.set("value", target);
        parameter.value = target;
        sendTrackState(trackIndex, record);
        post(
            "Mixer-Window: set send ",
            parameter.name,
            " on ",
            record.name,
            " to ",
            target,
            "\n"
        );
    } catch (error) {
        post("Mixer-Window ERROR: send update failed: ", error.message, "\n");
        refresh();
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
        var selectedOption = options[selectedIndex];
        var selectedIdentifier = normalizeRoutingIdentifier(
            selectedOption.identifier
        );
        post(
            "Mixer-Window DEBUG: route request track=",
            record.name,
            " property=",
            property,
            " display_name=",
            selectedOption.display_name,
            " identifier=",
            selectedIdentifier,
            "\n"
        );
        record.api.set(property, {identifier: selectedIdentifier});
        pendingRoute = {
            trackIndex: trackIndex,
            trackId: record.id,
            property: property,
            identifier: String(selectedIdentifier)
        };
        routeVerifyTask.cancel();
        routeVerifyTask.schedule(120);
    } catch (error) {
        post("Mixer-Window ERROR: routing update failed: ", error.message, "\n");
    }
}

function selectTrack(index) {
    var trackIndex = integerValue(index, "track index");
    var record = tracks[trackIndex];
    if (!record) {
        post("Mixer-Window ERROR: no channel at index ", trackIndex, "\n");
        refresh();
        return;
    }

    try {
        if (record.api.id === 0 || record.api.id !== record.id) {
            refresh();
            return;
        }
        var view = new LiveAPI(null, "live_set view");
        if (view.id === 0) {
            throw new Error("Live Set view API returned id 0");
        }
        view.set("selected_track", ["id", record.id]);
        post("Mixer-Window: selected track ", record.name, "\n");
    } catch (error) {
        post("Mixer-Window ERROR: track selection failed: ", error.message, "\n");
    }
}

function verifyRoute() {
    var pending = pendingRoute;
    pendingRoute = null;
    if (!pending) {
        return;
    }

    var record = tracks[pending.trackIndex];
    try {
        if (!record || record.id !== pending.trackId || record.api.id !== pending.trackId) {
            throw new Error("Track changed before routing could be verified");
        }
        var value = record.api.get(pending.property);
        var rawIdentifier = dictionaryValue(value, "identifier", 0);
        var actualIdentifier = rawIdentifier === null
            ? ""
            : String(rawIdentifier);
        post(
            "Mixer-Window DEBUG: route readback track=",
            record.name,
            " property=",
            pending.property,
            " display_name=",
            dictionaryField(value, "display_name"),
            " identifier=",
            actualIdentifier,
            "\n"
        );
        if (actualIdentifier !== pending.identifier) {
            throw new Error(
                "Live kept routing at "
                    + (dictionaryField(value, "display_name") || "an unknown choice")
            );
        }
        refresh();
    } catch (error) {
        post("Mixer-Window ERROR: routing selection failed: ", error.message, "\n");
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

function readSendParameters(path, isMaster) {
    if (isMaster) {
        return [];
    }
    var mixer = new LiveAPI(null, path + " mixer_device");
    if (mixer.id === 0) {
        throw new Error("Mixer device unavailable for " + path);
    }
    var sendCount = count(mixer, "sends");
    if (sendCount !== returnNames.length) {
        post(
            "Mixer-Window: ",
            path,
            " exposes ",
            sendCount,
            " send(s) for ",
            returnNames.length,
            " return track(s)\n"
        );
    }
    var sends = [];
    var i;
    for (i = 0; i < sendCount; i++) {
        var sendPath = path + " mixer_device sends " + i;
        var parameter = new LiveAPI(null, sendPath);
        if (parameter.id === 0) {
            post(
                "Mixer-Window ERROR: send parameter unavailable at ",
                sendPath,
                "\n"
            );
            sends.push({
                api: null,
                id: 0,
                minimum: 0,
                maximum: 1,
                value: 0,
                name: returnNames[i] || ("Send " + (i + 1)),
                available: false
            });
            continue;
        }
        var minimum = numberValue(parameter.get("min"), "send minimum");
        var maximum = numberValue(parameter.get("max"), "send maximum");
        if (maximum <= minimum) {
            throw new Error("Invalid send range for " + sendPath);
        }
        sends.push({
            api: parameter,
            id: parameter.id,
            minimum: minimum,
            maximum: maximum,
            value: numberValue(parameter.get("value"), "send value"),
            name: returnNames[i] || ("Send " + (i + 1)),
            available: true
        });
    }
    return sends;
}

function refreshTrackControls(record) {
    if (record.canToggleActivator) {
        record.activator = booleanValue(
            record.activatorApi.get("value"),
            "track activator"
        );
    }
    if (!record.isMaster) {
        record.solo = booleanValue(
            record.api.get("solo"),
            "track solo state"
        );
    }
    if (record.canBeArmed) {
        record.arm = booleanValue(record.api.get("arm"), "track arm state");
    }
}

function refreshSendValues(record) {
    var i;
    for (i = 0; i < record.sends.length; i++) {
        var parameter = record.sends[i];
        if (!parameter.available) {
            continue;
        }
        if (!parameter.api || parameter.api.id !== parameter.id) {
            throw new Error("Send parameter changed for " + parameter.name);
        }
        parameter.value = numberValue(
            parameter.api.get("value"),
            "send value"
        );
    }
}

function optionalTrackBoolean(track, property, trackId) {
    try {
        return booleanValue(track.get(property), property);
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
        return false;
    }
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
        return type || channel || "-";
    } catch (error) {
        post(
            "Mixer-Window ERROR: unable to read ",
            direction,
            " routing: ",
            error.message,
            "\n"
        );
        return "-";
    }
}

function routingFieldLabel(value) {
    return dictionaryField(value, "display_name") || "-";
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
        if (
            option.identifier === null
            || option.identifier === undefined
            || option.identifier === ""
            || !option.display_name
        ) {
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
        if (
            value.display_name
            && value.identifier !== null
            && value.identifier !== undefined
        ) {
            options.push({
                display_name: String(value.display_name),
                identifier: normalizeRoutingIdentifier(value.identifier)
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
        ? {
            display_name: displayName,
            identifier: normalizeRoutingIdentifier(identifier)
        }
        : null;
}

function normalizeRoutingIdentifier(identifier) {
    if (typeof identifier === "number") {
        return identifier;
    }
    var text = String(identifier);
    if (/^-?\d+$/.test(text)) {
        return Number(text);
    }
    return text;
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
        encodeURIComponent(JSON.stringify(trackExtra(record, true)))
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
        record.isSelected ? 1 : 0,
        record.color,
        encodeURIComponent(JSON.stringify(trackExtra(record, false)))
    );
}

function trackExtra(record, includeRouting) {
    var extra = {
        isRegularTrack: record.isRegularTrack,
        trackNumber: record.trackNumber,
        canToggleActivator: record.canToggleActivator,
        activator: record.activator,
        solo: record.solo,
        canBeArmed: record.canBeArmed,
        arm: record.arm,
        sends: sendStates(record)
    };
    if (includeRouting) {
        extra.pan = normalizedPan(record);
        extra.panDisplayValue = record.panDisplayValue;
        extra.isSelected = record.isSelected;
        extra.color = record.color;
        extra.inputType = record.inputType;
        extra.inputChannel = record.inputChannel;
        extra.outputType = record.outputType;
        extra.outputChannel = record.outputChannel;
        extra.hasPan = record.hasPan;
        extra.routingOptions = record.routingOptions;
    }
    return extra;
}

function sendStates(record) {
    var sends = [];
    var i;
    for (i = 0; i < record.sends.length; i++) {
        var parameter = record.sends[i];
        sends.push({
            name: parameter.name,
            available: parameter.available,
            value: normalizedValue(
                parameter.value,
                parameter.minimum,
                parameter.maximum
            )
        });
    }
    return sends;
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
            var decibels = Number(match[0]);
            if (Math.round(Math.abs(decibels) * 100) === 0) {
                decibels = 0;
            }
            return decibels.toFixed(2) + " dB";
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

function valueAtDb(parameter, minimum, maximum, targetDb) {
    if (targetDb === -Infinity) {
        return minimum;
    }
    var minimumDb = displayDbForValue(parameter, minimum);
    var maximumDb = displayDbForValue(parameter, maximum);
    if (targetDb < minimumDb || targetDb > maximumDb) {
        throw new Error(
            "Requested dB value is outside the parameter range ("
                + minimumDb
                + " to "
                + maximumDb
                + " dB)"
        );
    }

    var lower = minimum;
    var upper = maximum;
    var iteration;
    for (iteration = 0; iteration < 32; iteration++) {
        var midpoint = (lower + upper) / 2;
        if (displayDbForValue(parameter, midpoint) < targetDb) {
            lower = midpoint;
        } else {
            upper = midpoint;
        }
    }
    return (lower + upper) / 2;
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

function isArray(value) {
    return Object.prototype.toString.call(value) === "[object Array]";
}
