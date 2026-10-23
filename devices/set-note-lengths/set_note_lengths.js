autowatch = 1;
inlets = 1;
outlets = 0;

var CHANGE_TOLERANCE = 0.000001;

function loadbang() {
    post("Set-Note-Lengths: v0.0.1 loaded; Set Lengths control ready\n");
}

function bang() {
    setSelectedNoteLengths();
}

function msg_int(value) {
    if (value !== 0) {
        setSelectedNoteLengths();
    }
}

function setSelectedNoteLengths() {
    post("Set-Note-Lengths: trigger received\n");

    try {
        var songView = new LiveAPI(apiCallback, "live_set view");
        requireLiveObject(songView, "Song View");

        var detailClipId = objectId(
            songView.get("detail_clip"),
            "Song View detail_clip"
        );
        if (detailClipId === 0) {
            post("Set-Note-Lengths: no clip is open in Detail View; no changes\n");
            return;
        }

        var clip = new LiveAPI(apiCallback, "id " + detailClipId);
        requireLiveObject(clip, "Detail View clip");
        post(
            "Set-Note-Lengths: active clip id=",
            clip.id,
            " path=",
            clip.path,
            "\n"
        );

        if (numericValue(clip.get("is_midi_clip"), "is_midi_clip") !== 1) {
            post("Set-Note-Lengths: active clip is not MIDI; no changes\n");
            return;
        }

        var clipViewId = objectId(clip.get("view"), "Detail View clip view");
        if (clipViewId === 0) {
            throw new Error("The active MIDI clip has no accessible Clip View");
        }
        var clipView = new LiveAPI(apiCallback, "id " + clipViewId);
        requireLiveObject(clipView, "Clip View");

        var quantization = integerValue(
            clipView.get("grid_quantization"),
            "grid_quantization"
        );
        var isTriplet = integerValue(
            clipView.get("grid_is_triplet"),
            "grid_is_triplet"
        );
        if (isTriplet !== 0 && isTriplet !== 1) {
            throw new Error("Unexpected grid_is_triplet value: " + isTriplet);
        }

        var duration = gridSizeInBeats(quantization, isTriplet);
        var label = gridLabel(quantization, isTriplet);
        var notes = extractNotes(clip.call("get_selected_notes_extended"));
        if (notes.length === 0) {
            post(
                "Set-Note-Lengths: no selected MIDI notes; active grid=",
                label,
                " (",
                duration,
                " beat(s)); no changes\n"
            );
            return;
        }

        post(
            "Set-Note-Lengths: selected notes=",
            notes.length,
            ", active grid=",
            label,
            ", target duration=",
            duration,
            " beat(s)\n"
        );

        var modifications = [];
        var unchangedCount = 0;
        for (var i = 0; i < notes.length; i++) {
            var note = selectedNoteMetadata(notes[i]);
            var previousDuration = numericValue(
                note.duration,
                "selected note duration"
            );
            if (Math.abs(previousDuration - duration) <= CHANGE_TOLERANCE) {
                unchangedCount++;
                post(
                    "Set-Note-Lengths: note ",
                    note.note_id,
                    " already has duration ",
                    duration,
                    " beat(s)\n"
                );
                continue;
            }

            modifications.push({
                note_id: note.note_id,
                duration: duration
            });
            post(
                "Set-Note-Lengths: note ",
                note.note_id,
                " duration ",
                previousDuration,
                " -> ",
                duration,
                " beat(s)\n"
            );
        }

        if (modifications.length === 0) {
            post(
                "Set-Note-Lengths: all ",
                unchangedCount,
                " selected note(s) already match the active grid\n"
            );
            return;
        }

        var modificationDict = new Dict();
        modificationDict.parse(JSON.stringify({ notes: modifications }));
        clip.call("apply_note_modifications", modificationDict);
        post(
            "Set-Note-Lengths: applied duration to ",
            modifications.length,
            " selected note(s); ",
            unchangedCount,
            " already matched. Start times and other note properties were not modified\n"
        );
    } catch (error) {
        post("Set-Note-Lengths ERROR: ", error.message, "\n");
    }
}

function gridSizeInBeats(quantization, isTriplet) {
    if (
        quantization < 4 ||
        quantization > 9 ||
        Math.floor(quantization) !== quantization
    ) {
        throw new Error(
            "Unsupported grid_quantization value " +
                quantization +
                "; expected a division from 1/1 through 1/32"
        );
    }
    var beats = 4 / Math.pow(2, quantization - 4);
    return isTriplet === 1 ? beats * (2 / 3) : beats;
}

function gridLabel(quantization, isTriplet) {
    var divisions = ["1/1", "1/2", "1/4", "1/8", "1/16", "1/32"];
    var label = divisions[quantization - 4];
    return isTriplet === 1 ? label + "T" : label;
}

function extractNotes(response) {
    var value = dictionaryValue(response);
    if (value && typeof value === "object" && !isArrayValue(value)) {
        value = value.notes;
    }
    if (isArrayValue(value) && value.length === 2 && value[0] === "notes") {
        value = dictionaryValue(value[1]);
    }
    if (!isArrayValue(value)) {
        throw new Error(
            "Live returned selected notes in an unsupported format: " +
                describeValue(response)
        );
    }
    return value;
}

function selectedNoteMetadata(value) {
    var note = dictionaryValue(value);
    if (!note || typeof note !== "object") {
        throw new Error("Live returned an invalid selected-note record");
    }
    if (typeof note.note_id === "undefined") {
        throw new Error("Selected note is missing note_id");
    }
    if (typeof note.duration === "undefined") {
        throw new Error("Selected note is missing duration");
    }
    return {
        note_id: integerValue(note.note_id, "selected note note_id"),
        duration: note.duration
    };
}

function dictionaryValue(value) {
    if (value instanceof Dict) {
        var keys = value.getkeys();
        var result = {};
        if (keys) {
            for (var i = 0; i < keys.length; i++) {
                result[keys[i]] = value.get(keys[i]);
            }
        }
        return result;
    }
    if (typeof value === "string") {
        var parsed = parseJson(value);
        if (parsed !== null) {
            return parsed;
        }
        var match = value.match(/^(?:dict|dictionary)\s+(.+)$/);
        if (match) {
            return dictionaryValue(new Dict(match[1]));
        }
    }
    if (
        isArrayValue(value) &&
        value.length === 2 &&
        (value[0] === "dict" || value[0] === "dictionary")
    ) {
        return dictionaryValue(new Dict(value[1]));
    }
    return value;
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
    if (
        typeof value !== "number" ||
        !isFinite(value) ||
        Math.floor(value) !== value
    ) {
        throw new Error(
            "Invalid Live object reference for " +
                propertyName +
                ": " +
                describeValue(value)
        );
    }
    return value;
}

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
    return id;
}

function integerValue(value, propertyName) {
    var number = numericValue(value, propertyName);
    if (Math.floor(number) !== number) {
        throw new Error("Invalid integer value for " + propertyName);
    }
    return number;
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

function parseJson(value) {
    try {
        return JSON.parse(value);
    } catch (error) {
        return null;
    }
}

function describeValue(value) {
    try {
        return JSON.stringify(value);
    } catch (error) {
        return String(value);
    }
}

function apiCallback() {}
