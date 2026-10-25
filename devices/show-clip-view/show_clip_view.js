autowatch = 1;
inlets = 1;
outlets = 0;

var CLIP_VIEW = "Detail/Clip";

function bang() {
    toggleClipView();
}

function msg_int(value) {
    if (value !== 0) {
        toggleClipView();
    }
}

function toggleClipView() {
    try {
        var view = new LiveAPI(apiCallback, "live_app view");
        requireLiveObject(view, "Application View");

        var wasVisible = numericValue(
            view.call("is_view_visible", CLIP_VIEW),
            "Clip View visibility"
        );
        if (wasVisible !== 0 && wasVisible !== 1) {
            throw new Error(
                "Unexpected Clip View visibility value: " + wasVisible
            );
        }

        if (wasVisible === 1) {
            view.call("hide_view", "Detail");
        } else {
            view.call("focus_view", CLIP_VIEW);
        }

        var isVisible = numericValue(
            view.call("is_view_visible", CLIP_VIEW),
            "Clip View visibility after toggle"
        );
        var expectedVisibility = wasVisible === 1 ? 0 : 1;
        if (isVisible !== expectedVisibility) {
            throw new Error(
                "Live did not change Clip View visibility (requested " +
                    expectedVisibility +
                    ", read back " +
                    isVisible +
                    ")"
            );
        }

        post(
            "Show-Clip-View: Clip View ",
            wasVisible === 1 ? "hidden" : "shown",
            "\n"
        );
    } catch (error) {
        post("Show-Clip-View ERROR: ", error.message, "\n");
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
    if (Object.prototype.toString.call(value) === "[object Array]") {
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
