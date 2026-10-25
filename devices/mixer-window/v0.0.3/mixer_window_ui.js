autowatch = 1;
inlets = 1;
outlets = 1;

var WIDTH = 1440;
var HEIGHT = 760;
var MIN_STRIP_WIDTH = 112;
var LEFT_MARGIN = 16;
var RIGHT_CONTROLS_WIDTH = 82;
var TOP = 58;
var channels = [];
var totalChannels = 0;
var scrollOffset = 0;
var dragIndex = -1;
var resizeTask = new Task(syncWindowSize, this);
var resizeWarningPosted = false;
var lastAppliedWidth = 0;
var lastAppliedHeight = 0;

mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;

function loadbang() {
    resizeTask.schedule(250);
}

function freebang() {
    resizeTask.cancel();
}

function syncWindowSize() {
    try {
        var window = this.patcher && this.patcher.wind;
        if (window && window.visible === false) {
            resizeTask.schedule(1000);
            return;
        }
        var size = window && window.size;
        var windowWidth;
        var windowHeight;
        if (size && typeof size.length === "number" && size.length >= 2) {
            if (size.length === 2) {
                windowWidth = Number(size[0]);
                windowHeight = Number(size[1]);
            } else {
                windowWidth = Number(size[2]) - Number(size[0]);
                windowHeight = Number(size[3]) - Number(size[1]);
            }
        }
        if (!isFinite(windowWidth) || !isFinite(windowHeight)) {
            throw new Error("patcher window size is unavailable");
        }

        if (windowWidth > 320 && windowHeight > 240) {
            var ui = this.patcher.getnamed("mixer-ui");
            if (!ui) {
                throw new Error("mixer-ui object is unavailable");
            }
            var desiredWidth = Math.max(320, Math.floor(windowWidth - 20));
            var desiredHeight = Math.max(240, Math.floor(windowHeight - 40));
            if (
                Math.abs(lastAppliedWidth - desiredWidth) > 2
                || Math.abs(lastAppliedHeight - desiredHeight) > 2
            ) {
                ui.setboxattr("size", [desiredWidth, desiredHeight]);
                lastAppliedWidth = desiredWidth;
                lastAppliedHeight = desiredHeight;
            }
        }
    } catch (error) {
        if (!resizeWarningPosted) {
            post(
                "Mixer-Window UI: automatic window sizing unavailable: ",
                error.message,
                "\n"
            );
            resizeWarningPosted = true;
        }
    }
    resizeTask.schedule(250);
}

function begin(total) {
    totalChannels = Number(total);
    redraw();
}

function track(
    index,
    id,
    name,
    value,
    minimum,
    maximum,
    displayValue,
    input,
    output,
    isMaster
) {
    var slot = Number(index);
    channels[slot] = {
        index: slot,
        id: Number(id),
        name: decode(name),
        value: clamp(Number(value), 0, 1),
        minimum: Number(minimum),
        maximum: Number(maximum),
        displayValue: decode(displayValue),
        input: decode(input),
        output: decode(output),
        isMaster: Number(isMaster) === 1
    };
    redraw();
}

function trackerror(index, name) {
    var slot = Number(index);
    channels[slot] = {
        index: slot,
        id: 0,
        name: decode(name),
        value: 0.75,
        minimum: 0,
        maximum: 1,
        displayValue: "Unavailable",
        input: "-",
        output: "-",
        isMaster: false
    };
    redraw();
}

function end(total) {
    totalChannels = Number(total);
    channels.length = totalChannels;
    scrollOffset = clamp(
        scrollOffset,
        0,
        Math.max(0, totalChannels - layout().visibleChannels)
    );
    redraw();
}

function display(index, value) {
    var channel = channels[Number(index)];
    if (channel) {
        channel.displayValue = decode(value);
        redraw();
    }
}

function anything() {
    var message = arrayfromargs(messagename, arguments);
    if (message[0] === "begin") {
        begin(message[1]);
    } else if (message[0] === "track") {
        track.apply(this, message.slice(1));
    } else if (message[0] === "trackerror") {
        trackerror(message[1], message[2]);
    } else if (message[0] === "display") {
        display(message[1], message[2]);
    } else if (message[0] === "end") {
        end(message[1]);
    }
}

function paint() {
    var geometry = layout();
    fill(0.13, 0.14, 0.16, 1);
    mgraphics.rectangle(0, 0, geometry.width, geometry.height);
    mgraphics.fill();

    text(24, 36, "MIXER", 22, 0.92, 0.94, 0.96, 1);
    text(
        112,
        34,
        "Volume control  |  Inputs and outputs follow Live routing",
        12,
        0.63,
        0.68,
        0.72,
        1
    );
    text(
        geometry.width - 148,
        34,
        totalChannels + " CHANNELS",
        11,
        0.55,
        0.75,
        0.78,
        1
    );

    var i;
    for (i = 0; i < geometry.visibleChannels; i++) {
        var channel = channels[scrollOffset + i];
        if (channel) {
            drawChannel(channel, i, geometry);
        } else {
            drawEmpty(i, geometry);
        }
    }
    drawFooter(geometry);
}

function drawChannel(channel, visibleIndex, geometry) {
    var x = geometry.left + visibleIndex * geometry.stripWidth;
    var y = TOP;
    var stripWidth = geometry.stripWidth - 4;
    var labelLength = Math.max(10, Math.floor(stripWidth / 7));
    var routeLength = Math.max(8, Math.floor((stripWidth - 34) / 6));
    fill(0.19, 0.20, 0.23, 1);
    mgraphics.rectangle(x, y, stripWidth, geometry.stripHeight);
    mgraphics.fill();

    fill(
        channel.isMaster ? 0.90 : 0.27,
        channel.isMaster ? 0.49 : 0.72,
        channel.isMaster ? 0.27 : 0.74,
        1
    );
    mgraphics.rectangle(x, y, stripWidth, 4);
    mgraphics.fill();

    text(x + 8, y + 25, fit(channel.name, labelLength), 13, 0.94, 0.95, 0.97, 1);
    drawRouteBox(x + 7, y + 38, stripWidth - 14, channel.input, routeLength);
    drawRouteBox(x + 7, y + 78, stripWidth - 14, channel.output, routeLength);
    text(x + 8, y + 137, "VOLUME", 9, 0.55, 0.60, 0.64, 1);
    text(
        x + 10,
        y + 158,
        fit(channel.displayValue, labelLength),
        11,
        0.91,
        0.93,
        0.94,
        1
    );

    var railX = x + stripWidth * 0.55;
    fill(0.08, 0.09, 0.10, 1);
    mgraphics.rectangle(
        railX,
        geometry.faderTop,
        8,
        geometry.faderBottom - geometry.faderTop
    );
    mgraphics.fill();

    drawFaderScale(x + 8, railX, geometry);
    var knobY = geometry.faderTop
        + (1 - channel.value) * (geometry.faderBottom - geometry.faderTop - 12);
    fill(0.35, 0.76, 0.77, 1);
    mgraphics.rectangle(railX - 17, knobY, 42, 12);
    mgraphics.fill();
    fill(0.78, 0.91, 0.91, 1);
    mgraphics.rectangle(railX - 13, knobY + 4, 34, 2);
    mgraphics.fill();

    text(
        x + 10,
        y + geometry.stripHeight - 14,
        channel.isMaster ? "MASTER" : "LIVE",
        9,
        0.50,
        0.56,
        0.60,
        1
    );
}

function drawRouteBox(x, y, width, value, labelLength) {
    fill(0.10, 0.11, 0.12, 1);
    mgraphics.rectangle(x, y, width, 30);
    mgraphics.fill();
    text(x + 5, y + 19, fit(value, labelLength), 10, 0.82, 0.84, 0.86, 1);
    text(x + width - 12, y + 18, "v", 9, 0.56, 0.60, 0.64, 1);
}

function drawFaderScale(labelX, railX, geometry) {
    var marks = [
        { label: "0", value: 1 },
        { label: "-6", value: 0.83 },
        { label: "-12", value: 0.67 },
        { label: "-18", value: 0.50 },
        { label: "-24", value: 0.33 },
        { label: "-36", value: 0.17 },
        { label: "-48", value: 0 }
    ];
    var i;
    for (i = 0; i < marks.length; i++) {
        var markY = geometry.faderTop
            + (1 - marks[i].value)
                * (geometry.faderBottom - geometry.faderTop - 12)
            + 6;
        fill(0.40, 0.43, 0.46, 1);
        mgraphics.rectangle(railX - 5, markY, 3, 1);
        mgraphics.fill();
        text(labelX, markY + 4, marks[i].label, 8, 0.51, 0.55, 0.58, 1);
    }
}

function drawEmpty(visibleIndex, geometry) {
    var x = geometry.left + visibleIndex * geometry.stripWidth;
    fill(0.16, 0.17, 0.19, 1);
    mgraphics.rectangle(x, TOP, geometry.stripWidth - 4, geometry.stripHeight);
    mgraphics.fill();
}

function drawFooter(geometry) {
    text(
        24,
        geometry.height - 12,
        "Move this window to your mixer display.",
        10,
        0.50,
        0.55,
        0.59,
        1
    );
    var controlsX = geometry.width - RIGHT_CONTROLS_WIDTH;
    drawArrow(controlsX, geometry.height - 36, "<");
    drawArrow(controlsX + 34, geometry.height - 36, ">");
}

function drawArrow(x, y, label) {
    fill(0.24, 0.26, 0.29, 1);
    mgraphics.rectangle(x, y, 32, 26);
    mgraphics.fill();
    text(x + 10, y + 18, label, 14, 0.90, 0.92, 0.94, 1);
}

function onclick(x, y, button) {
    var geometry = layout();
    var controlsX = geometry.width - RIGHT_CONTROLS_WIDTH;
    if (y > geometry.height - 42 && x > controlsX - 2) {
        if (x < controlsX + 32) {
            scrollOffset = Math.max(0, scrollOffset - 1);
        } else {
            scrollOffset = Math.min(
                Math.max(0, totalChannels - geometry.visibleChannels),
                scrollOffset + 1
            );
        }
        redraw();
        return;
    }

    var visibleIndex = Math.floor((x - geometry.left) / geometry.stripWidth);
    var channelIndex = scrollOffset + visibleIndex;
    if (
        visibleIndex >= 0
        && visibleIndex < geometry.visibleChannels
        && y >= geometry.faderTop - 12
        && y <= geometry.faderBottom + 12
        && channels[channelIndex]
        && channels[channelIndex].id !== 0
    ) {
        dragIndex = channelIndex;
        setFader(dragIndex, y);
    }
}

function ondblclick(x, y, button) {
    var geometry = layout();
    var visibleIndex = Math.floor((x - geometry.left) / geometry.stripWidth);
    var channelIndex = scrollOffset + visibleIndex;
    if (
        visibleIndex >= 0
        && visibleIndex < geometry.visibleChannels
        && y >= geometry.faderTop - 12
        && y <= geometry.faderBottom + 12
        && channels[channelIndex]
        && channels[channelIndex].id !== 0
    ) {
        dragIndex = -1;
        setFader(channelIndex, geometry.faderTop);
    }
}

function ondrag(x, y, button) {
    if (dragIndex >= 0) {
        setFader(dragIndex, y);
    }
}

function onidle(x, y, button) {
    if (button === 0) {
        dragIndex = -1;
    }
}

function setFader(index, y) {
    var geometry = layout();
    var normalized = 1
        - (y - geometry.faderTop)
            / (geometry.faderBottom - geometry.faderTop - 12);
    normalized = clamp(normalized, 0, 1);
    channels[index].value = normalized;
    redraw();
    outlet(0, "volume", index, normalized);
}

function onresize(width, height) {
    if (isFinite(Number(width)) && Number(width) > 0) {
        WIDTH = Number(width);
    }
    if (isFinite(Number(height)) && Number(height) > 0) {
        HEIGHT = Number(height);
    }
    redraw();
}

function layout() {
    var size = mgraphics.size;
    if (size && typeof size.length === "number" && size.length >= 2) {
        if (Number(size[0]) > 0) {
            WIDTH = Number(size[0]);
        }
        if (Number(size[1]) > 0) {
            HEIGHT = Number(size[1]);
        }
    }
    var usableWidth = Math.max(
        MIN_STRIP_WIDTH,
        WIDTH - LEFT_MARGIN * 2 - RIGHT_CONTROLS_WIDTH
    );
    var visibleChannels = Math.max(
        1,
        Math.floor(usableWidth / MIN_STRIP_WIDTH)
    );
    var stripWidth = usableWidth / visibleChannels;
    var stripHeight = Math.max(160, HEIGHT - TOP - 36);
    var faderTop = TOP + Math.min(
        240,
        Math.max(160, (HEIGHT - TOP - 100) * 0.38)
    );
    var faderBottom = Math.max(faderTop + 48, HEIGHT - 88);
    return {
        width: WIDTH,
        height: HEIGHT,
        left: LEFT_MARGIN,
        stripWidth: stripWidth,
        stripHeight: stripHeight,
        visibleChannels: visibleChannels,
        faderTop: faderTop,
        faderBottom: faderBottom
    };
}

function text(x, y, value, size, red, green, blue, alpha) {
    mgraphics.set_source_rgba(red, green, blue, alpha);
    mgraphics.select_font_face("Arial");
    mgraphics.set_font_size(size);
    mgraphics.move_to(x, y);
    mgraphics.show_text(String(value));
}

function fill(red, green, blue, alpha) {
    mgraphics.set_source_rgba(red, green, blue, alpha);
}

function fit(value, length) {
    var result = String(value);
    if (result.length > length) {
        result = result.substring(0, length - 3) + "...";
    }
    return result;
}

function decode(value) {
    try {
        return decodeURIComponent(String(value));
    } catch (error) {
        post("Mixer-Window UI ERROR: invalid encoded label\n");
        return "Unavailable";
    }
}

function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
}

function redraw() {
    mgraphics.redraw();
}
