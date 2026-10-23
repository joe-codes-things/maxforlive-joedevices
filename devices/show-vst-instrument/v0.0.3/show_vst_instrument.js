autowatch = 1;
inlets = 1;
outlets = 0;

var MAX_RACK_DEPTH = 16;

function bang() {
    toggleSelectedTrackVst();
}

function msg_int(value) {
    if (value !== 0) {
        toggleSelectedTrackVst();
    }
}

function toggleSelectedTrackVst() {
    post("Show-VST-Instrument: trigger received\n");
    logLiveVersion();

    try {
        var songView = new LiveAPI(apiCallback, "live_set view");
        requireLiveObject(songView, "Song View");

        var selectedTrackId = objectId(
            songView.get("selected_track"),
            "Song View selected_track"
        );
        if (selectedTrackId === 0) {
            throw new Error("No track is selected");
        }

        var track = new LiveAPI(apiCallback, "id " + selectedTrackId);
        requireLiveObject(track, "Selected track");
        var hasMidiInput = numericValue(
            track.get("has_midi_input"),
            "has_midi_input"
        );
        post(
            "Show-VST-Instrument: selected track id=",
            track.id,
            " path=",
            track.path,
            " has_midi_input=",
            hasMidiInput,
            "\n"
        );

        if (hasMidiInput !== 1) {
            post("Show-VST-Instrument: selected track is not a MIDI track\n");
            return;
        }

        var plugins = [];
        findVstInstruments(track, plugins, 0);
        if (plugins.length === 0) {
            post("Show-VST-Instrument: no VST instrument found on selected track\n");
            return;
        }

        var selectedPlugin = plugins[0];
        var editorOpen = numericValue(
            selectedPlugin.get("is_editor_open"),
            "is_editor_open"
        );
        var targetState = editorOpen === 1 ? 0 : 1;
        selectedPlugin.set("is_editor_open", targetState);
        var resultingState = numericValue(
            selectedPlugin.get("is_editor_open"),
            "is_editor_open after set"
        );
        if (resultingState !== targetState) {
            throw new Error(
                "Live did not change PluginDevice.is_editor_open (requested " +
                    targetState +
                    ", read back " +
                    resultingState +
                    "). The property may not be available in this Live version."
            );
        }
        post(
            "Show-VST-Instrument: found ",
            plugins.length,
            " VST instrument(s); toggled ",
            selectedPlugin.path,
            " is_editor_open ",
            editorOpen,
            " -> ",
            resultingState,
            "\n"
        );
    } catch (error) {
        post("Show-VST-Instrument ERROR: ", error.message, "\n");
    }
}

function logLiveVersion() {
    try {
        var liveApp = new LiveAPI(apiCallback, "live_app");
        requireLiveObject(liveApp, "Live application");
        post(
            "Show-VST-Instrument: Live version=",
            describeValue(liveApp.call("get_version_string")),
            "\n"
        );
    } catch (error) {
        post(
            "Show-VST-Instrument: Live version query failed: ",
            error.message,
            "\n"
        );
    }
}

function findVstInstruments(parent, plugins, depth) {
    if (depth > MAX_RACK_DEPTH) {
        throw new Error(
            "Nested rack search exceeded the maximum depth of " +
                MAX_RACK_DEPTH
        );
    }

    var deviceIds = childObjectIds(parent, "devices");
    var index;
    for (index = 0; index < deviceIds.length; index++) {
        var device = liveObjectById(deviceIds[index], "Device");

        if (isVstInstrument(device)) {
            plugins.push(device);
        }

        var canHaveChains = numericValue(
            device.get("can_have_chains"),
            "can_have_chains"
        );
        if (canHaveChains === 1) {
            var chainIds = childObjectIds(device, "chains");
            var chainIndex;
            for (chainIndex = 0; chainIndex < chainIds.length; chainIndex++) {
                var chain = liveObjectById(chainIds[chainIndex], "Rack chain");
                findVstInstruments(chain, plugins, depth + 1);
            }
        }
    }
}

function childObjectIds(parent, childName) {
    var childCount = parent.getcount(childName);
    var references = parent.get(childName);
    post(
        "Show-VST-Instrument: ",
        parent.path,
        " ",
        childName,
        " count=",
        childCount,
        " references=",
        describeValue(references),
        "\n"
    );

    var ids = parseObjectIds(references, childName);
    if (ids.length !== childCount) {
        throw new Error(
            "Live returned " +
                ids.length +
                " object ID(s) for " +
                childName +
                ", but getcount reports " +
                childCount
        );
    }
    return ids;
}

function parseObjectIds(value, childName) {
    if (!isArrayValue(value)) {
        if (value === null || typeof value === "undefined") {
            return [];
        }
        return [objectId(value, childName)];
    }

    var ids = [];
    var index = value[0] === childName ? 1 : 0;
    while (index < value.length) {
        if (value[index] === "id") {
            if (index + 1 >= value.length) {
                throw new Error("Incomplete object ID list for " + childName);
            }
            ids.push(objectId(value[index + 1], childName));
            index += 2;
            continue;
        }
        ids.push(objectId(value[index], childName));
        index++;
    }
    return ids;
}

function liveObjectById(id, label) {
    var object = new LiveAPI(apiCallback, "id " + id);
    requireLiveObject(object, label + " id " + id);
    return object;
}

function isVstInstrument(device) {
    var className = stringValue(
        device.getstring("class_name"),
        "class_name"
    );
    if (className !== "PluginDevice") {
        return false;
    }

    return numericValue(device.get("type"), "device type") === 1;
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
    return id;
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

function stringValue(value, propertyName) {
    if (isArrayValue(value)) {
        if (value.length !== 1) {
            throw new Error("Unexpected value for " + propertyName);
        }
        value = value[0];
    }
    if (typeof value !== "string") {
        throw new Error("Invalid string value for " + propertyName);
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
