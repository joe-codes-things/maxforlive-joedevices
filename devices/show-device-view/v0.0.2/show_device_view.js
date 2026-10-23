autowatch = 1;
inlets = 1;
outlets = 0;

var DEVICE_VIEW = "Detail/DeviceChain";

function bang() {
    toggleDeviceView();
}

function msg_int(value) {
    if (value !== 0) {
        toggleDeviceView();
    }
}

function toggleDeviceView() {
    try {
        var view = new LiveAPI(apiCallback, "live_app view");
        requireLiveObject(view, "Application View");

        var wasVisible = numericValue(
            view.call("is_view_visible", DEVICE_VIEW),
            "Device View visibility"
        );
        if (wasVisible !== 0 && wasVisible !== 1) {
            throw new Error(
                "Unexpected Device View visibility value: " + wasVisible
            );
        }

        if (wasVisible === 1) {
            view.call("hide_view", "Detail");
        } else {
            view.call("focus_view", DEVICE_VIEW);
        }

        var isVisible = numericValue(
            view.call("is_view_visible", DEVICE_VIEW),
            "Device View visibility after toggle"
        );
        var expectedVisibility = wasVisible === 1 ? 0 : 1;
        if (isVisible !== expectedVisibility) {
            throw new Error(
                "Live did not change Device View visibility (requested " +
                    expectedVisibility +
                    ", read back " +
                    isVisible +
                    ")"
            );
        }

        post(
            "Show-Device-View: Device View ",
            wasVisible === 1 ? "hidden" : "shown",
            "\n"
        );
    } catch (error) {
        post("Show-Device-View ERROR: ", error.message, "\n");
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
