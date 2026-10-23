autowatch = 1;
inlets = 1;
outlets = 0;

function bang() {
    quantizeSelectedNotes();
}

function msg_int(value) {
    if (value !== 0) {
        quantizeSelectedNotes();
    }
}

function quantizeSelectedNotes() {
    post("Q-for-Quantize: trigger received\n");

    try {
        var songView = new LiveAPI(apiCallback, "live_set view");
        requireLiveObject(songView, "Song View");

        var detailClipId = objectId(
            songView.get("detail_clip"),
            "Song View detail_clip"
        );
        if (detailClipId === 0) {
            throw new Error("No clip is open in Live's Detail View");
        }

        var clip = new LiveAPI(apiCallback, "id " + detailClipId);
        requireLiveObject(clip, "Detail View clip");
        post(
            "Q-for-Quantize: clip id=",
            clip.id,
            " path=",
            clip.path,
            "\n"
        );

        var isMidiClip = numericValue(clip.get("is_midi_clip"), "is_midi_clip");
        if (isMidiClip !== 1) {
            throw new Error("The Detail View clip is not a MIDI clip");
        }

        var clipViewId = objectId(clip.get("view"), "Detail View clip view");
        if (clipViewId === 0) {
            throw new Error("The active MIDI clip has no accessible Clip View");
        }

        var clipView = new LiveAPI(apiCallback, "id " + clipViewId);
        requireLiveObject(clipView, "Clip View");
        post(
            "Q-for-Quantize: Clip View id=",
            clipView.id,
            " path=",
            clipView.path,
            "\n"
        );

        var quantization = numericValue(
            clipView.get("grid_quantization"),
            "grid_quantization"
        );
        var isTriplet = numericValue(
            clipView.get("grid_is_triplet"),
            "grid_is_triplet"
        );
        post(
            "Q-for-Quantize: grid_quantization=",
            quantization,
            " grid_is_triplet=",
            isTriplet,
            "\n"
        );
        var gridBeats = gridSizeInBeats(quantization, isTriplet);

        var response = clip.call("get_selected_notes_extended");
        var selectedNotes = extractNotes(response);
        if (selectedNotes.length === 0) {
            post("Q-for-Quantize: no selected MIDI notes\n");
            return;
        }

        var notesToModify = [];
        var changedCount = 0;
        var i;
        for (i = 0; i < selectedNotes.length; i++) {
            var note = selectedNoteMetadata(selectedNotes[i]);
            var startTime = numericValue(note.start_time, "note start_time");
            var targetStart = Math.round(startTime / gridBeats) * gridBeats;
            notesToModify.push({
                note_id: note.note_id,
                start_time: targetStart
            });

            if (Math.abs(targetStart - startTime) > 0.000001) {
                changedCount++;
                post(
                    "Q-for-Quantize: note ",
                    note.note_id,
                    " start ",
                    startTime,
                    " -> ",
                    targetStart,
                    "\n"
                );
            }
        }

        if (changedCount === 0) {
            post(
                "Q-for-Quantize: ",
                selectedNotes.length,
                " selected note(s) already on the ",
                gridLabel(quantization, isTriplet),
                " grid\n"
            );
            return;
        }

        var modifications = new Dict();
        modifications.parse(JSON.stringify({ notes: notesToModify }));
        clip.call("apply_note_modifications", modifications);
        post(
            "Q-for-Quantize: quantized ",
            changedCount,
            " of ",
            selectedNotes.length,
            " selected note(s) to ",
            gridLabel(quantization, isTriplet),
            "\n"
        );
    } catch (error) {
        post("Q-for-Quantize ERROR: ", error.message, "\n");
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

function gridSizeInBeats(quantization, isTriplet) {
    if (quantization < 4 || quantization > 9 || Math.floor(quantization) !== quantization) {
        throw new Error(
            "Unsupported grid_quantization value " +
                quantization +
                "; expected a Grid Size division from 1/1 through 1/32"
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

function dictionaryValue(value) {
    if (value instanceof Dict) {
        var keys = value.getkeys();
        var result = {};
        var i;
        if (keys) {
            for (i = 0; i < keys.length; i++) {
                result[keys[i]] = value.get(keys[i]);
            }
        }
        return result;
    }

    if (typeof value === "string") {
        var json = parseJson(value);
        if (json !== null) {
            return json;
        }
        var match = value.match(/^(?:dict|dictionary)\s+(.+)$/);
        if (match) {
            return dictionaryValue(new Dict(match[1]));
        }
        return value;
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

function selectedNoteMetadata(value) {
    var note = dictionaryValue(value);
    if (!note || typeof note !== "object") {
        throw new Error("Live returned an invalid selected-note record");
    }

    if (typeof note.note_id === "undefined") {
        throw new Error("Selected note is missing note_id");
    }
    if (typeof note.start_time === "undefined") {
        throw new Error("Selected note is missing start_time");
    }
    return {
        note_id: note.note_id,
        start_time: note.start_time
    };
}

function numericValue(value, propertyName) {
    if (isArrayValue(value)) {
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
