autowatch = 1;
inlets = 1;
outlets = 1;

var WIDTH = 1440;
var HEIGHT = 760;
var STRIP_WIDTH = 140;
var LEFT_MARGIN = 18;
var TOP = 80;
var STRIP_HEIGHT = 650;
var FADER_TOP = 296;
var FADER_BOTTOM = 650;
var VISIBLE_CHANNELS = 9;
var channels = [];
var totalChannels = 0;
var scrollOffset = 0;
var dragIndex = -1;

mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;

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
        Math.max(0, totalChannels - VISIBLE_CHANNELS)
    );
    redraw();
}

function anything() {
    var message = arrayfromargs(messagename, arguments);
    if (message[0] === "begin") {
        begin(message[1]);
    } else if (message[0] === "track") {
        track.apply(this, message.slice(1));
    } else if (message[0] === "trackerror") {
        trackerror(message[1], message[2]);
    } else if (message[0] === "end") {
        end(message[1]);
    }
}

function paint() {
    fill(0.13, 0.14, 0.16, 1);
    mgraphics.rectangle(0, 0, WIDTH, HEIGHT);
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
        WIDTH - 206,
        34,
        totalChannels + " CHANNELS",
        11,
        0.55,
        0.75,
        0.78,
        1
    );

    var i;
    for (i = 0; i < VISIBLE_CHANNELS; i++) {
        var channel = channels[scrollOffset + i];
        if (channel) {
            drawChannel(channel, i);
        } else {
            drawEmpty(i);
        }
    }
    drawFooter();
}

function drawChannel(channel, visibleIndex) {
    var x = LEFT_MARGIN + visibleIndex * STRIP_WIDTH;
    var y = TOP;
    fill(0.19, 0.20, 0.23, 1);
    mgraphics.rectangle(x, y, STRIP_WIDTH - 4, STRIP_HEIGHT);
    mgraphics.fill();

    fill(
        channel.isMaster ? 0.90 : 0.27,
        channel.isMaster ? 0.49 : 0.72,
        channel.isMaster ? 0.27 : 0.74,
        1
    );
    mgraphics.rectangle(x, y, STRIP_WIDTH - 4, 4);
    mgraphics.fill();

    text(x + 10, y + 28, fit(channel.name, 16), 13, 0.94, 0.95, 0.97, 1);
    text(x + 10, y + 70, "IN", 9, 0.51, 0.56, 0.60, 1);
    text(
        x + 10,
        y + 90,
        fit(channel.input, 18),
        10,
        0.78,
        0.80,
        0.82,
        1
    );
    text(x + 10, y + 117, "OUT", 9, 0.51, 0.56, 0.60, 1);
    text(
        x + 10,
        y + 137,
        fit(channel.output, 18),
        10,
        0.78,
        0.80,
        0.82,
        1
    );

    text(x + 10, y + 181, "VOLUME", 9, 0.55, 0.60, 0.64, 1);
    text(
        x + 10,
        y + 202,
        fit(channel.displayValue, 15),
        11,
        0.91,
        0.93,
        0.94,
        1
    );

    var railX = x + 66;
    fill(0.08, 0.09, 0.10, 1);
    mgraphics.rectangle(railX, FADER_TOP, 8, FADER_BOTTOM - FADER_TOP);
    mgraphics.fill();

    var knobY = FADER_TOP
        + (1 - channel.value) * (FADER_BOTTOM - FADER_TOP - 12);
    fill(0.35, 0.76, 0.77, 1);
    mgraphics.rectangle(railX - 17, knobY, 42, 12);
    mgraphics.fill();
    fill(0.78, 0.91, 0.91, 1);
    mgraphics.rectangle(railX - 13, knobY + 4, 34, 2);
    mgraphics.fill();

    text(
        x + 10,
        y + 610,
        channel.isMaster ? "MASTER" : "LIVE",
        9,
        0.50,
        0.56,
        0.60,
        1
    );
}

function drawEmpty(visibleIndex) {
    var x = LEFT_MARGIN + visibleIndex * STRIP_WIDTH;
    fill(0.16, 0.17, 0.19, 1);
    mgraphics.rectangle(x, TOP, STRIP_WIDTH - 4, STRIP_HEIGHT);
    mgraphics.fill();
}

function drawFooter() {
    text(
        24,
        HEIGHT - 28,
        "Move this window to your mixer display.",
        10,
        0.50,
        0.55,
        0.59,
        1
    );
    drawArrow(LEFT_MARGIN + 9 * STRIP_WIDTH + 4, HEIGHT - 46, "<");
    drawArrow(LEFT_MARGIN + 9 * STRIP_WIDTH + 46, HEIGHT - 46, ">");
}

function drawArrow(x, y, label) {
    fill(0.24, 0.26, 0.29, 1);
    mgraphics.rectangle(x, y, 32, 26);
    mgraphics.fill();
    text(x + 10, y + 18, label, 14, 0.90, 0.92, 0.94, 1);
}

function onclick(x, y, button) {
    if (y > HEIGHT - 55 && x > LEFT_MARGIN + 9 * STRIP_WIDTH) {
        if (x < LEFT_MARGIN + 9 * STRIP_WIDTH + 42) {
            scrollOffset = Math.max(0, scrollOffset - 1);
        } else {
            scrollOffset = Math.min(
                Math.max(0, totalChannels - VISIBLE_CHANNELS),
                scrollOffset + 1
            );
        }
        redraw();
        return;
    }

    var visibleIndex = Math.floor((x - LEFT_MARGIN) / STRIP_WIDTH);
    var channelIndex = scrollOffset + visibleIndex;
    if (
        visibleIndex >= 0
        && visibleIndex < VISIBLE_CHANNELS
        && y >= FADER_TOP - 12
        && y <= FADER_BOTTOM + 12
        && channels[channelIndex]
        && channels[channelIndex].id !== 0
    ) {
        dragIndex = channelIndex;
        setFader(dragIndex, y);
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
    var normalized = 1 - (y - FADER_TOP) / (FADER_BOTTOM - FADER_TOP - 12);
    normalized = clamp(normalized, 0, 1);
    channels[index].value = normalized;
    redraw();
    outlet(0, "volume", index, normalized);
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
