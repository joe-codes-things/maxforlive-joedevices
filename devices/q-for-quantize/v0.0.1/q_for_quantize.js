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
        var clip = new LiveAPI(null, "live_set view detail_clip");
        if (clip.id === 0) {
            throw new Error("No clip is open in Live's Detail View");
        }

        var isMidiClip = numericValue(clip.get("is_midi_clip"), "is_midi_clip");
        if (isMidiClip !== 1) {
            throw new Error("The Detail View clip is not a MIDI clip");
        }

        var clipView = new LiveAPI(null, clip.path + " view");
        if (clipView.id === 0) {
            throw new Error("The active MIDI clip has no accessible Clip View");
        }

        var quantization = numericValue(
            clipView.get("grid_quantization"),
            "grid_quantization"
        );
        var isTriplet = numericValue(
            clipView.get("grid_is_triplet"),
            "grid_is_triplet"
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

function gridSizeInBeats(quantization, isTriplet) {
    if (quantization < 4 || quantization > 9 || Math.floor(quantization) !== quantization) {
        throw new Error(
            "Unsupported grid_quantization value " +
                quantization +
                "; expected a Note Length division from 1/1 through 1/32"
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
    if (value && typeof value === "object" && !(value instanceof Array)) {
        value = value.notes;
    }
    if (value instanceof Array && value.length === 2 && value[0] === "notes") {
        value = dictionaryValue(value[1]);
    }
    if (!(value instanceof Array)) {
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
        value instanceof Array &&
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
    if (value instanceof Array) {
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
