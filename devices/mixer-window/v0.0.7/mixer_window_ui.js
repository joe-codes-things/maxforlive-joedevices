autowatch = 1;
inlets = 1;
outlets = 1;

var WIDTH = 1440;
var HEIGHT = 760;
var MIN_STRIP_WIDTH = 112;
var LEFT_MARGIN = 16;
var RIGHT_CONTROLS_WIDTH = 82;
var TOP = 58;
var SEND_TOP = 343;
var channels = [];
var totalChannels = 0;
var returnCount = 0;
var scrollOffset = 0;
var sendPageOffset = 0;
var keyboardSelectionIndex = -1;
var keyboardSelectionTime = 0;
var dragIndex = -1;
var panDragIndex = -1;
var sendDrag = null;
var faderResizeDrag = false;
var faderTopOffset = 0;
var openMenu = null;
var hoverX = -1;
var hoverY = -1;
var pendingFaderClick = null;
var volumeEditIndex = -1;
var volumeEditText = "";
var volumeEditCursor = 0;
var volumeEditError = "";
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

function begin(total, returns) {
    totalChannels = Number(total);
    returnCount = Number(returns) || 0;
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
    isMaster,
    extraJson
) {
    var slot = Number(index);
    var extra = parseExtra(extraJson);
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
        inputType: extra.inputType || decode(input),
        inputChannel: extra.inputChannel || "",
        outputType: extra.outputType || decode(output),
        outputChannel: extra.outputChannel || "",
        routingOptions: extra.routingOptions || {},
        pan: clamp(Number(extra.pan), 0, 1),
        panDisplayValue: formatPanDisplay(extra.panDisplayValue),
        hasPan: extra.hasPan !== false && Number(isMaster) !== 1,
        isSelected: Boolean(extra.isSelected),
        color: Number(extra.color) || 0,
        isRegularTrack: Boolean(extra.isRegularTrack),
        trackNumber: Number(extra.trackNumber) || 0,
        canToggleActivator: Boolean(extra.canToggleActivator),
        activator: Boolean(extra.activator),
        solo: Boolean(extra.solo),
        canBeArmed: Boolean(extra.canBeArmed),
        arm: Boolean(extra.arm),
        sends: parseSends(extra.sends),
        isMaster: Number(isMaster) === 1
    };
    if (
        channels[slot].isRegularTrack
        && channels[slot].isSelected
        && new Date().getTime() - keyboardSelectionTime > 500
    ) {
        keyboardSelectionIndex = slot;
    }
    redraw();
}

function state(
    index,
    value,
    displayValue,
    pan,
    panDisplayValue,
    isSelected,
    color,
    extraJson
) {
    var channel = channels[Number(index)];
    if (!channel) {
        return;
    }
    channel.value = clamp(Number(value), 0, 1);
    channel.displayValue = decode(displayValue);
    channel.pan = clamp(Number(pan), 0, 1);
    channel.panDisplayValue = formatPanDisplay(decode(panDisplayValue));
    channel.isSelected = Number(isSelected) === 1;
    channel.color = Number(color) || 0;
    applyTrackExtra(channel, parseExtra(extraJson));
    if (
        channel.isRegularTrack
        && channel.isSelected
        && new Date().getTime() - keyboardSelectionTime > 500
    ) {
        keyboardSelectionIndex = channel.index;
    }
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
        displayValue: "-",
        input: "-",
        output: "-",
        sends: [],
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
    if (
        openMenu
        && (!channels[openMenu.channelIndex]
            || channels[openMenu.channelIndex].id !== openMenu.trackId)
    ) {
        openMenu = null;
    }
    if (volumeEditIndex >= totalChannels || !channels[volumeEditIndex]) {
        volumeEditIndex = -1;
        volumeEditText = "";
        volumeEditCursor = 0;
        volumeEditError = "";
    }
    redraw();
}

function formatPanDisplay(value) {
    var textValue = String(value || "").trim();
    var match = /^([-+]?\d+(?:\.\d+)?)\s*([LR])?$/i.exec(textValue);
    if (!match) {
        return textValue || "-";
    }
    var amount = Number(match[1]);
    if (!isFinite(amount) || Math.abs(amount) < 0.5) {
        return "C";
    }
    var side = match[2]
        ? match[2].toUpperCase()
        : amount < 0 ? "L" : "R";
    return Math.round(Math.abs(amount)) + side;
}

function anything() {
    var message = arrayfromargs(messagename, arguments);
    if (message[0] === "begin") {
        begin(message[1], message[2]);
    } else if (message[0] === "track") {
        track.apply(this, message.slice(1));
    } else if (message[0] === "trackerror") {
        trackerror(message[1], message[2]);
    } else if (message[0] === "state") {
        state.apply(this, message.slice(1));
    } else if (message[0] === "end") {
        end(message[1]);
    } else if (message[0] === "volumeEditResult") {
        volumeEditResult(message[1], message[2], message[3]);
    } else if (message[0] === "keychar") {
        keychar(message[1]);
    } else if (message[0] === "keycode") {
        keycode(message[1]);
    }
}

function paint() {
    var geometry = layout();
    fill(0.20, 0.21, 0.22, 1);
    mgraphics.rectangle(0, 0, geometry.width, geometry.height);
    mgraphics.fill();

    text(24, 36, "MIXER", 22, 0.92, 0.94, 0.96, 1);
    text(
        112,
        33,
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
    drawRoutingMenu(geometry);
}

function drawChannel(channel, visibleIndex, geometry) {
    var x = geometry.left + visibleIndex * geometry.stripWidth;
    var y = TOP;
    var stripWidth = geometry.stripWidth - 4;
    var labelLength = Math.max(10, Math.floor(stripWidth / 7));
    var routeLength = Math.max(8, Math.floor((stripWidth - 34) / 6));
    var trackRgb = trackColor(channel.color, channel.isMaster);
    var baseRgb = channel.isSelected
        ? [0.225, 0.305, 0.325]
        : [0.17, 0.18, 0.19];
    var tint = channel.color > 0 ? 0.12 : 0;
    fill(
        baseRgb[0] * (1 - tint) + trackRgb[0] * tint,
        baseRgb[1] * (1 - tint) + trackRgb[1] * tint,
        baseRgb[2] * (1 - tint) + trackRgb[2] * tint,
        1
    );
    mgraphics.rectangle(x, y, stripWidth, geometry.stripHeight);
    mgraphics.fill();

    fill(trackRgb[0], trackRgb[1], trackRgb[2], 1);
    mgraphics.rectangle(x, y, stripWidth, 4);
    mgraphics.fill();

    text(x + 8, y + 25, fit(channel.name, labelLength), 13, 0.94, 0.95, 0.97, 1);
    drawRouteBox(
        x + 7,
        y + 36,
        stripWidth - 14,
        channel.inputType,
        routeLength,
        channel,
        "input",
        "type"
    );
    drawRouteBox(
        x + 7,
        y + 70,
        stripWidth - 14,
        channel.inputChannel,
        routeLength,
        channel,
        "input",
        "channel"
    );
    drawRouteBox(
        x + 7,
        y + 104,
        stripWidth - 14,
        channel.outputType,
        routeLength,
        channel,
        "output",
        "type"
    );
    drawRouteBox(
        x + 7,
        y + 138,
        stripWidth - 14,
        channel.outputChannel,
        routeLength,
        channel,
        "output",
        "channel"
    );
    if (volumeEditIndex === channel.index) {
        fill(0.08, 0.09, 0.10, 1);
        mgraphics.rectangle(x + 7, y + 180, stripWidth - 14, 25);
        mgraphics.fill();
        text(
            x + 10,
            y + 198,
            volumeEditText.substring(0, volumeEditCursor)
                + "|"
                + volumeEditText.substring(volumeEditCursor),
            11,
            0.96,
            0.97,
            0.98,
            1
        );
        if (volumeEditError) {
            text(
                x + 8,
                y + 215,
                fit(volumeEditError, labelLength),
                8,
                0.94,
                0.37,
                0.32,
                1
            );
        }
    } else {
        text(
            x + 10,
            y + 198,
            fit(channel.displayValue, labelLength),
            11,
            0.91,
            0.93,
            0.94,
            1
        );
    }

    if (channel.hasPan) {
        text(
            x + 8,
            y + 238,
            "PAN  " + fit(channel.panDisplayValue, 8),
            9,
            0.58,
            0.62,
            0.66,
            1
        );
        drawPanSlider(channel, x, stripWidth, y + 247);
    }
    drawTrackControls(channel, x, stripWidth, y + 272);
    drawSends(channel, x, stripWidth, y + SEND_TOP);

    var railX = x + stripWidth * 0.55;
    fill(0.32, 0.35, 0.38, 1);
    mgraphics.rectangle(
        x + 10,
        geometry.faderTop - 16,
        stripWidth - 20,
        1
    );
    mgraphics.fill();
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
}

function drawRouteBox(x, y, width, value, labelLength, channel, direction, kind) {
    var hasOptions = routingOptions(channel, direction, kind).length > 0;
    if (hasOptions) {
        fill(0.11, 0.12, 0.13, 1);
        mgraphics.rectangle(x, y, width, 30);
        mgraphics.fill();
    }
    text(x + 5, y + 19, fit(value || "-", labelLength), 10, 0.82, 0.84, 0.86, 1);
    if (hasOptions) {
        text(x + width - 12, y + 18, "v", 9, 0.56, 0.60, 0.64, 1);
    }
}

function drawPanSlider(channel, x, stripWidth, y) {
    var left = x + 17;
    var width = stripWidth - 34;
    var center = left + width / 2;
    fill(0.09, 0.10, 0.11, 1);
    mgraphics.rectangle(left, y, width, 5);
    mgraphics.fill();
    var knobX = left + channel.pan * width;
    var fillLeft = Math.min(center, knobX);
    var fillWidth = Math.abs(knobX - center);
    if (fillWidth > 0) {
        fill(0.20, 0.56, 0.84, 1);
        mgraphics.rectangle(fillLeft, y, fillWidth, 5);
        mgraphics.fill();
    }
    fill(0.32, 0.35, 0.38, 1);
    mgraphics.rectangle(center, y - 3, 1, 11);
    mgraphics.fill();
    fill(0.77, 0.79, 0.81, 1);
    mgraphics.rectangle(knobX - 4, y - 4, 8, 13);
    mgraphics.fill();
}

function drawTrackControls(channel, x, stripWidth, top) {
    if (channel.isMaster || channel.id === 0) {
        return;
    }
    var gap = 3;
    var buttonWidth = (stripWidth - 16 - gap * 2) / 3;
    var buttons = [
        {
            label: channel.trackNumber > 0 ? String(channel.trackNumber) : "R",
            name: "activator",
            enabled: channel.canToggleActivator,
            active: channel.activator
        },
        {
            label: "S",
            name: "solo",
            enabled: true,
            active: channel.solo
        },
        {
            label: "R",
            name: "arm",
            enabled: channel.canBeArmed,
            active: channel.arm
        }
    ];
    var i;
    for (i = 0; i < buttons.length; i++) {
        var buttonX = x + 8 + i * (buttonWidth + gap);
        fill(
            buttons[i].active ? 0.22 : 0.12,
            buttons[i].active ? 0.46 : 0.13,
            buttons[i].active ? 0.49 : 0.14,
            1
        );
        mgraphics.rectangle(buttonX, top, buttonWidth, 22);
        mgraphics.fill();
        text(
            buttonX + buttonWidth / 2 - 4,
            top + 15,
            buttons[i].label,
            10,
            buttons[i].enabled ? 0.91 : 0.44,
            buttons[i].enabled ? 0.94 : 0.47,
            buttons[i].enabled ? 0.96 : 0.50,
            1
        );
    }
}

function drawSends(channel, x, stripWidth, top) {
    if (channel.isMaster || returnCount < 1) {
        return;
    }
    var geometry = sendLayout(stripWidth);
    var pageCount = Math.max(1, geometry.pageCount);
    var title = "SENDS " + (sendPageOffset + 1) + "/" + pageCount;
    text(x + 8, top + 10, title, 7, 0.55, 0.60, 0.63, 1);
    if (pageCount > 1) {
        text(x + stripWidth - 30, top + 10, "<", 10, 0.80, 0.84, 0.87, 1);
        text(x + stripWidth - 16, top + 10, ">", 10, 0.80, 0.84, 0.87, 1);
    }
    var visibleCount = Math.min(
        geometry.columns,
        channel.sends.length - sendPageOffset * geometry.columns
    );
    var slot;
    for (slot = 0; slot < visibleCount; slot++) {
        var index = sendPageOffset * geometry.columns + slot;
        var location = sendLocation(slot, x, top, geometry);
        var send = channel.sends[index];
        text(
            location.centerX - location.cellWidth / 2 + 2,
            location.rowY + 22,
            fit(send.name, Math.max(2, Math.floor(location.cellWidth / 5))),
            7,
            0.63,
            0.68,
            0.71,
            1
        );
        var radius = location.radius;
        mgraphics.new_path();
        mgraphics.arc(
            location.centerX,
            location.centerY,
            radius,
            Math.PI * 0.75,
            Math.PI * 2.25
        );
        mgraphics.set_line_width(3);
        mgraphics.set_source_rgba(0.09, 0.10, 0.11, 1);
        mgraphics.stroke();
        if (send.available && send.value > 0) {
            mgraphics.new_path();
            mgraphics.arc(
                location.centerX,
                location.centerY,
                radius,
                Math.PI * 0.75,
                Math.PI * (0.75 + 1.5 * send.value)
            );
            mgraphics.set_line_width(3);
            mgraphics.set_source_rgba(0.20, 0.56, 0.84, 1);
            mgraphics.stroke();
        }
        var angle = Math.PI * (0.75 + 1.5 * send.value);
        mgraphics.new_path();
        mgraphics.move_to(location.centerX, location.centerY);
        mgraphics.line_to(
            location.centerX + Math.cos(angle) * (radius - 2),
            location.centerY + Math.sin(angle) * (radius - 2)
        );
        mgraphics.set_line_width(1);
        mgraphics.set_source_rgba(
            send.available ? 0.84 : 0.42,
            send.available ? 0.87 : 0.45,
            send.available ? 0.89 : 0.48,
            1
        );
        mgraphics.stroke();
    }
}

function trackColor(value, isMaster) {
    if (!isFinite(value) || value <= 0) {
        return isMaster ? [0.91, 0.43, 0.24] : [0.29, 0.72, 0.74];
    }
    var packed = Math.floor(value);
    return [
        ((packed >> 16) & 255) / 255,
        ((packed >> 8) & 255) / 255,
        (packed & 255) / 255
    ];
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
    if (volumeEditIndex >= 0) {
        if (isVolumeReadoutHit(x, y, geometry)) {
            positionVolumeCursor(x, geometry);
            return;
        }
        volumeEditIndex = -1;
        volumeEditText = "";
        volumeEditCursor = 0;
        volumeEditError = "";
    }
    if (openMenu) {
        if (chooseMenuOption(x, y)) {
            return;
        }
        openMenu = null;
        redraw();
    }

    if (
        y >= geometry.faderTop - 21
        && y <= geometry.faderTop - 11
        && x >= geometry.left
        && x <= geometry.width - RIGHT_CONTROLS_WIDTH
    ) {
        faderResizeDrag = true;
        setFaderTop(y + 16, geometry);
        return;
    }

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
    var channel = channels[channelIndex];
    if (
        channel
        && visibleIndex >= 0
        && visibleIndex < geometry.visibleChannels
        && !channel.isMaster
        && channel.id !== 0
        && channel.id !== 0
    ) {
        var routeField = routeFieldAt(y);
        if (routeField) {
            var options = routingOptions(
                channel,
                routeField.direction,
                routeField.kind
            );
            if (options.length > 0) {
                post(
                    "Mixer-Window UI DEBUG: opened ",
                    routeField.direction,
                    " ",
                    routeField.kind,
                    " menu for ",
                    channel.name,
                    " (",
                    options.length,
                    " choices)\n"
                );
                openMenu = {
                    channelIndex: channelIndex,
                    trackId: channel.id,
                    direction: routeField.direction,
                    kind: routeField.kind,
                    options: options,
                    offset: 0,
                    x: geometry.left + visibleIndex * geometry.stripWidth + 6,
                    y: Math.min(y, geometry.height - 220),
                    width: Math.max(130, geometry.stripWidth - 12)
                };
                redraw();
                return;
            }
        }
    }

    if (
        channel
        && visibleIndex >= 0
        && visibleIndex < geometry.visibleChannels
        && !channel.isMaster
    ) {
        var buttonName = trackControlAt(channel, x, y, visibleIndex, geometry);
        if (buttonName) {
            requestTrackSelection(channelIndex);
            if (controlEnabled(channel, buttonName)) {
                outlet(0, "control", channelIndex, buttonName);
            }
            return;
        }
        var sendIndex = sendAt(channel, x, y, visibleIndex, geometry);
        if (sendIndex === -2) {
            requestTrackSelection(channelIndex);
            return;
        }
        if (sendIndex >= 0) {
            requestTrackSelection(channelIndex);
            var send = channel.sends[sendIndex];
            sendDrag = {
                channelIndex: channelIndex,
                sendIndex: sendIndex,
                startY: y,
                startValue: send.value
            };
            return;
        }
    }

    if (
        channel
        && channel.hasPan
        && visibleIndex >= 0
        && visibleIndex < geometry.visibleChannels
        && y >= TOP + 239
        && y <= TOP + 263
    ) {
        requestTrackSelection(channelIndex);
        panDragIndex = channelIndex;
        setPan(panDragIndex, x);
        return;
    }

    if (
        visibleIndex >= 0
        && visibleIndex < geometry.visibleChannels
        && y >= geometry.faderTop - 12
        && y <= geometry.faderBottom + 12
        && channels[channelIndex]
        && channels[channelIndex].id !== 0
    ) {
        requestTrackSelection(channelIndex);
        var nub = faderNubBounds(channelIndex, visibleIndex, geometry);
        if (
            x >= nub.left
            && x <= nub.right
            && y >= nub.top
            && y <= nub.bottom
        ) {
            var now = new Date().getTime();
            if (
                pendingFaderClick
                && pendingFaderClick.channelIndex === channelIndex
                && now - pendingFaderClick.time <= 500
                && Math.abs(x - pendingFaderClick.x) <= 14
                && Math.abs(y - pendingFaderClick.y) <= 14
            ) {
                pendingFaderClick = null;
                dragIndex = -1;
                setFader(channelIndex, geometry.faderTop);
                return;
            }
            pendingFaderClick = {
                channelIndex: channelIndex,
                time: now,
                x: x,
                y: y
            };
            dragIndex = channelIndex;
        } else {
            pendingFaderClick = null;
        }
        return;
    }

    if (
        channel
        && visibleIndex >= 0
        && visibleIndex < geometry.visibleChannels
        && channel.id !== 0
    ) {
        requestTrackSelection(channelIndex);
    }
}

function ondblclick(x, y, button) {
    var geometry = layout();
    var visibleIndex = Math.floor((x - geometry.left) / geometry.stripWidth);
    var channelIndex = scrollOffset + visibleIndex;
    if (isVolumeReadoutHit(x, y, geometry)) {
        beginVolumeEdit(channelIndex);
        return;
    }
    if (
        visibleIndex >= 0
        && visibleIndex < geometry.visibleChannels
        && channels[channelIndex]
        && channels[channelIndex].hasPan
        && y >= TOP + 239
        && y <= TOP + 263
    ) {
        panDragIndex = -1;
        setPanValue(channelIndex, 0.5);
        return;
    }
}

function ondrag(x, y, button) {
    if (dragIndex >= 0) {
        if (
            pendingFaderClick
            && (
                Math.abs(x - pendingFaderClick.x) > 8
                || Math.abs(y - pendingFaderClick.y) > 8
            )
        ) {
            pendingFaderClick = null;
        }
        setFader(dragIndex, y);
    } else if (panDragIndex >= 0) {
        setPan(panDragIndex, x);
    } else if (sendDrag) {
        setSend(
            sendDrag.channelIndex,
            sendDrag.sendIndex,
            clamp(sendDrag.startValue + (sendDrag.startY - y) / 100, 0, 1)
        );
    } else if (faderResizeDrag) {
        setFaderTop(y, layout());
    }
}

function onidle(x, y, button) {
    if (hoverX !== x || hoverY !== y) {
        hoverX = x;
        hoverY = y;
        if (openMenu) {
            redraw();
        }
    }
    if (button === 0) {
        dragIndex = -1;
        panDragIndex = -1;
        sendDrag = null;
        faderResizeDrag = false;
    }
}

function trackControlAt(channel, x, y, visibleIndex, geometry) {
    var top = TOP + 272;
    if (y < top || y > top + 22) {
        return "";
    }
    var stripX = geometry.left + visibleIndex * geometry.stripWidth;
    var buttonWidth = (geometry.stripWidth - 4 - 16 - 6) / 3;
    var relativeX = x - (stripX + 8);
    if (relativeX < 0) {
        return "";
    }
    var stride = buttonWidth + 3;
    var button = Math.floor(relativeX / stride);
    if (button < 0 || button > 2 || relativeX % stride > buttonWidth) {
        return "";
    }
    return ["activator", "solo", "arm"][button];
}

function controlEnabled(channel, name) {
    if (name === "activator") {
        return channel.canToggleActivator;
    }
    if (name === "arm") {
        return channel.canBeArmed;
    }
    return name === "solo";
}

function sendAt(channel, x, y, visibleIndex, geometry) {
    if (channel.isMaster || !channel.sends || channel.sends.length === 0) {
        return -1;
    }
    var stripX = geometry.left + visibleIndex * geometry.stripWidth;
    var sendGeometry = sendLayout(geometry.stripWidth - 4);
    var pageCount = sendGeometry.pageCount;
    if (pageCount > 1 && y >= TOP + SEND_TOP && y <= TOP + SEND_TOP + 15) {
        var relativeX = x - stripX;
        if (relativeX >= geometry.stripWidth - 34 && relativeX < geometry.stripWidth - 20) {
            sendPageOffset = Math.max(0, sendPageOffset - 1);
            redraw();
            return -2;
        }
        if (relativeX >= geometry.stripWidth - 20 && relativeX <= geometry.stripWidth - 4) {
            sendPageOffset = Math.min(pageCount - 1, sendPageOffset + 1);
            redraw();
            return -2;
        }
    }
    var visibleCount = Math.min(
        sendGeometry.columns,
        channel.sends.length - sendPageOffset * sendGeometry.columns
    );
    var slot;
    for (slot = 0; slot < visibleCount; slot++) {
        var index = sendPageOffset * sendGeometry.columns + slot;
        var location = sendLocation(slot, stripX, TOP + SEND_TOP, sendGeometry);
        var dx = x - location.centerX;
        var dy = y - location.centerY;
        if (
            channel.sends[index].available
            && dx * dx + dy * dy <= location.radius * location.radius
        ) {
            return index;
        }
    }
    return -1;
}

function isVolumeReadoutHit(x, y, geometry) {
    var visibleIndex = Math.floor((x - geometry.left) / geometry.stripWidth);
    var channelIndex = scrollOffset + visibleIndex;
    return visibleIndex >= 0
        && visibleIndex < geometry.visibleChannels
        && channels[channelIndex]
        && y >= TOP + 180
        && y <= TOP + 205;
}

function positionVolumeCursor(x, geometry) {
    var visibleIndex = Math.floor((x - geometry.left) / geometry.stripWidth);
    var stripX = geometry.left + visibleIndex * geometry.stripWidth;
    volumeEditCursor = clamp(
        Math.round((x - (stripX + 10)) / 6),
        0,
        volumeEditText.length
    );
    redraw();
}

function beginVolumeEdit(channelIndex) {
    var channel = channels[channelIndex];
    if (!channel || channel.id === 0) {
        return;
    }
    var match = /[-+]?(?:\d+\.?\d*|\.\d+)/.exec(channel.displayValue);
    volumeEditText = match
        ? Number(match[0]).toFixed(2)
        : /^-inf/i.test(channel.displayValue) ? "-inf" : "0.00";
    volumeEditCursor = volumeEditText.length;
    volumeEditError = "";
    volumeEditIndex = channelIndex;
    redraw();
}

function volumeEditResult(index, succeeded, message) {
    if (Number(index) !== volumeEditIndex) {
        return;
    }
    if (Number(succeeded) === 1) {
        volumeEditIndex = -1;
        volumeEditText = "";
        volumeEditCursor = 0;
        volumeEditError = "";
    } else {
        volumeEditError = decode(message) || "Invalid dB value";
    }
    redraw();
}

function keychar(value) {
    if (volumeEditIndex < 0) {
        return;
    }
    var code = Number(value);
    var character = String.fromCharCode(code);
    var candidate = volumeEditText.substring(0, volumeEditCursor)
        + character
        + volumeEditText.substring(volumeEditCursor);
    if (
        (character === "-" || character === "." || /^[0-9]$/.test(character))
        && /^-?(?:\d{0,4}(?:\.\d{0,2})?|\.\d{0,2})?$/.test(candidate)
    ) {
        volumeEditText = candidate;
        volumeEditCursor++;
    } else if (
        [105, 110, 102].indexOf(code) !== -1
        && volumeEditCursor === volumeEditText.length
        && (
            candidate === "-i"
            || candidate === "-in"
            || candidate === "-inf"
        )
    ) {
        volumeEditText = candidate;
        volumeEditCursor++;
    }
    volumeEditError = "";
    redraw();
}

function keycode(value) {
    var code = Number(value);
    if (volumeEditIndex >= 0) {
        if (code === -4) {
            commitVolumeEdit();
        } else if (code === -3) {
            volumeEditIndex = -1;
            volumeEditText = "";
            volumeEditCursor = 0;
            volumeEditError = "";
            redraw();
        } else if (code === -11) {
            volumeEditCursor = Math.max(0, volumeEditCursor - 1);
            redraw();
        } else if (code === -12) {
            volumeEditCursor = Math.min(
                volumeEditText.length,
                volumeEditCursor + 1
            );
            redraw();
        } else if (code === -15) {
            volumeEditCursor = 0;
            redraw();
        } else if (code === -16) {
            volumeEditCursor = volumeEditText.length;
            redraw();
        } else if (code === -7) {
            volumeEditText = volumeEditText.substring(
                0,
                Math.max(0, volumeEditCursor - 1)
            ) + volumeEditText.substring(volumeEditCursor);
            volumeEditCursor = Math.max(0, volumeEditCursor - 1);
            volumeEditError = "";
            redraw();
        } else if (code === -6) {
            volumeEditText = volumeEditText.substring(0, volumeEditCursor)
                + volumeEditText.substring(volumeEditCursor + 1);
            volumeEditError = "";
            redraw();
        }
        return;
    }
    if (code === -11) {
        selectAdjacentTrack(-1);
    } else if (code === -12) {
        selectAdjacentTrack(1);
    } else if (code === -3) {
        escape();
    }
}

function commitVolumeEdit() {
    if (volumeEditText === "-inf") {
        outlet(0, "volumeDb", volumeEditIndex, "-inf");
        return;
    }
    var value = Number(volumeEditText);
    if (
        !isFinite(value)
        || !/^-?(?:\d{1,4}(?:\.\d{0,2})?|\.\d{1,2})$/.test(volumeEditText)
    ) {
        volumeEditError = "Enter a dB value";
        redraw();
        return;
    }
    outlet(0, "volumeDb", volumeEditIndex, value);
}

function selectAdjacentTrack(direction) {
    var current = keyboardSelectionIndex;
    var i;
    if (
        current < 0
        || !channels[current]
        || !channels[current].isRegularTrack
    ) {
        current = -1;
        for (i = 0; i < channels.length; i++) {
            if (channels[i] && channels[i].isRegularTrack && channels[i].isSelected) {
                current = i;
                break;
            }
        }
    }
    if (current < 0) {
        current = direction < 0 ? 1 : -1;
    }
    var next = current + direction;
    while (
        next >= 0
        && next < channels.length
        && (!channels[next] || !channels[next].isRegularTrack)
    ) {
        next += direction;
    }
    if (next < 0 || next >= channels.length || !channels[next]) {
        return;
    }
    var geometry = layout();
    if (next < scrollOffset) {
        scrollOffset = next;
    } else if (next >= scrollOffset + geometry.visibleChannels) {
        scrollOffset = next - geometry.visibleChannels + 1;
    }
    requestTrackSelection(next);
    redraw();
}

function requestTrackSelection(index) {
    if (channels[index] && channels[index].isRegularTrack) {
        keyboardSelectionIndex = index;
        keyboardSelectionTime = new Date().getTime();
    }
    outlet(0, "selectTrack", index);
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

function faderNubBounds(channelIndex, visibleIndex, geometry) {
    var channel = channels[channelIndex];
    var stripX = geometry.left + visibleIndex * geometry.stripWidth;
    var railX = stripX + (geometry.stripWidth - 4) * 0.55;
    var knobY = geometry.faderTop
        + (1 - channel.value)
            * (geometry.faderBottom - geometry.faderTop - 12);
    return {
        left: railX - 17,
        right: railX + 25,
        top: knobY,
        bottom: knobY + 12
    };
}

function setPan(index, x) {
    var geometry = layout();
    var visibleIndex = index - scrollOffset;
    var channelX = geometry.left + visibleIndex * geometry.stripWidth;
    var stripWidth = geometry.stripWidth - 4;
    var left = channelX + 17;
    var width = stripWidth - 34;
    setPanValue(index, clamp((x - left) / width, 0, 1));
}

function setPanValue(index, normalized) {
    normalized = clamp(normalized, 0, 1);
    channels[index].pan = normalized;
    redraw();
    outlet(0, "pan", index, normalized);
}

function setSend(index, sendIndex, normalized) {
    normalized = clamp(normalized, 0, 1);
    var channel = channels[index];
    if (
        !channel
        || !channel.sends[sendIndex]
        || !channel.sends[sendIndex].available
    ) {
        return;
    }
    channel.sends[sendIndex].value = normalized;
    redraw();
    outlet(0, "send", index, sendIndex, normalized);
}

function setFaderTop(y, geometry) {
    faderTopOffset = clamp(
        y,
        geometry.minimumFaderTop,
        geometry.maximumFaderTop
    ) - geometry.baseFaderTop;
    redraw();
}

function escape() {
    if (openMenu) {
        openMenu = null;
        redraw();
    }
}

function routeFieldAt(y) {
    var localY = y - TOP;
    if (localY >= 36 && localY < 66) {
        return {direction: "input", kind: "type"};
    }
    if (localY >= 70 && localY < 100) {
        return {direction: "input", kind: "channel"};
    }
    if (localY >= 104 && localY < 134) {
        return {direction: "output", kind: "type"};
    }
    if (localY >= 138 && localY < 168) {
        return {direction: "output", kind: "channel"};
    }
    return null;
}

function routingOptions(channel, direction, kind) {
    var options = channel.routingOptions || {};
    var key = direction + kind.charAt(0).toUpperCase()
        + kind.slice(1) + "s";
    return options[key] || [];
}

function drawRoutingMenu(geometry) {
    if (!openMenu) {
        return;
    }
    var visibleRows = 8;
    var rowHeight = 22;
    var count = Math.min(visibleRows, openMenu.options.length - openMenu.offset);
    var menuHeight = (count + (openMenu.options.length > visibleRows ? 1 : 0))
        * rowHeight + 8;
    var x = clamp(openMenu.x, 4, geometry.width - openMenu.width - 4);
    var y = clamp(openMenu.y, TOP, geometry.height - menuHeight - 4);

    fill(0.08, 0.09, 0.10, 0.98);
    mgraphics.rectangle(x, y, openMenu.width, menuHeight);
    mgraphics.fill();
    var i;
    for (i = 0; i < count; i++) {
        var option = openMenu.options[openMenu.offset + i];
        var rowY = y + 4 + i * rowHeight;
        var hovered = hoverX >= x + 3
            && hoverX <= x + openMenu.width - 3
            && hoverY >= rowY
            && hoverY <= rowY + rowHeight - 1;
        fill(
            hovered ? 0.25 : 0.13,
            hovered ? 0.27 : 0.14,
            hovered ? 0.30 : 0.16,
            1
        );
        mgraphics.rectangle(x + 3, rowY, openMenu.width - 6, rowHeight - 1);
        mgraphics.fill();
        text(
            x + 8,
            rowY + 15,
            fit(option.display_name, Math.floor((openMenu.width - 16) / 7)),
            10,
            0.88,
            0.90,
            0.92,
            1
        );
    }
    if (openMenu.options.length > visibleRows) {
        var moreY = y + menuHeight - rowHeight - 4;
        fill(0.17, 0.18, 0.20, 1);
        mgraphics.rectangle(x + 3, moreY, openMenu.width - 6, rowHeight - 1);
        mgraphics.fill();
        text(
            x + 8,
            moreY + 15,
            openMenu.offset > 0 ? "More choices  (click for next)" : "More choices  (click)",
            9,
            0.64,
            0.68,
            0.71,
            1
        );
    }
    openMenu.drawX = x;
    openMenu.drawY = y;
    openMenu.drawHeight = menuHeight;
    openMenu.drawRows = count;
}

function chooseMenuOption(x, y) {
    if (
        x < openMenu.drawX
        || x > openMenu.drawX + openMenu.width
        || y < openMenu.drawY
        || y > openMenu.drawY + openMenu.drawHeight
    ) {
        return false;
    }
    var relativeY = y - openMenu.drawY - 4;
    var row = Math.floor(relativeY / 22);
    if (row >= openMenu.drawRows) {
        if (openMenu.options.length > 8) {
            openMenu.offset = (openMenu.offset + 8) % openMenu.options.length;
            redraw();
        } else {
            openMenu = null;
            redraw();
        }
        return true;
    }
    var optionIndex = openMenu.offset + row;
    var selected = openMenu.options[optionIndex];
    post(
        "Mixer-Window UI DEBUG: selected routing choice ",
        selected.display_name,
        " (identifier ",
        selected.identifier,
        ") for ",
        openMenu.direction,
        " ",
        openMenu.kind,
        " on channel ",
        openMenu.channelIndex,
        "\n"
    );
    outlet(
        0,
        "route",
        openMenu.channelIndex,
        openMenu.direction,
        openMenu.kind,
        optionIndex
    );
    openMenu = null;
    return true;
}

function parseExtra(value) {
    if (value === undefined || value === null || value === "") {
        return {};
    }
    try {
        var parsed = JSON.parse(decode(value));
        if (parsed && typeof parsed === "object") {
            return parsed;
        }
    } catch (error) {
        post("Mixer-Window UI ERROR: invalid channel state\n");
    }
    return {};
}

function applyTrackExtra(channel, extra) {
    channel.isRegularTrack = Boolean(extra.isRegularTrack);
    channel.trackNumber = Number(extra.trackNumber) || 0;
    channel.canToggleActivator = Boolean(extra.canToggleActivator);
    channel.activator = Boolean(extra.activator);
    channel.solo = Boolean(extra.solo);
    channel.canBeArmed = Boolean(extra.canBeArmed);
    channel.arm = Boolean(extra.arm);
    if (extra.sends !== undefined) {
        channel.sends = parseSends(extra.sends);
    }
}

function parseSends(value) {
    if (Object.prototype.toString.call(value) !== "[object Array]") {
        return [];
    }
    var sends = [];
    var i;
    for (i = 0; i < value.length; i++) {
        var send = value[i];
        if (!send || typeof send !== "object") {
            continue;
        }
        sends.push({
            name: String(send.name || ("Send " + (i + 1))),
            available: send.available !== false,
            value: clamp(Number(send.value) || 0, 0, 1)
        });
    }
    return sends;
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
    var faderBottom = Math.max(TOP + 324, HEIGHT - 88);
    var controlBottom = TOP + 272 + 22;
    if (returnCount > 0) {
        var sendsLayout = sendLayout(stripWidth - 4);
        sendPageOffset = clamp(
            sendPageOffset,
            0,
            Math.max(0, sendsLayout.pageCount - 1)
        );
        controlBottom = TOP + SEND_TOP + sendsLayout.rowHeight;
    }
    var minimumFaderTop = controlBottom + 24;
    var baseFaderTop = Math.max(minimumFaderTop, TOP + Math.min(
        290,
        Math.max(260, (HEIGHT - TOP - 100) * 0.48)
    ));
    var maximumFaderTop = Math.max(minimumFaderTop, faderBottom - 96);
    var faderTop = clamp(
        baseFaderTop + faderTopOffset,
        minimumFaderTop,
        maximumFaderTop
    );
    return {
        width: WIDTH,
        height: HEIGHT,
        left: LEFT_MARGIN,
        stripWidth: stripWidth,
        stripHeight: stripHeight,
        visibleChannels: visibleChannels,
        baseFaderTop: baseFaderTop,
        minimumFaderTop: minimumFaderTop,
        maximumFaderTop: maximumFaderTop,
        faderTop: faderTop,
        faderBottom: faderBottom
    };
}

function sendLayout(stripWidth) {
    var usable = Math.max(8, stripWidth - 14);
    var columns = Math.max(1, Math.floor(usable / 22));
    var cellWidth = usable / columns;
    return {
        columns: columns,
        pageCount: returnCount > 0 ? Math.ceil(returnCount / columns) : 0,
        cellWidth: cellWidth,
        rowHeight: 48,
        radius: Math.max(4, Math.min(9, (cellWidth - 4) / 2))
    };
}

function sendLocation(slot, x, top, geometry) {
    var visibleCount = Math.min(
        geometry.columns,
        returnCount - sendPageOffset * geometry.columns
    );
    var rowWidth = visibleCount * geometry.cellWidth;
    var left = x + 7
        + (geometry.columns * geometry.cellWidth - rowWidth) / 2;
    var cellX = left + slot * geometry.cellWidth;
    return {
        row: 0,
        column: slot,
        rowY: top,
        cellX: cellX,
        cellWidth: geometry.cellWidth,
        centerX: cellX + geometry.cellWidth / 2,
        centerY: top + 37,
        radius: geometry.radius
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
