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
var panDragIndex = -1;
var faderResizeDrag = false;
var faderTopOffset = 0;
var openMenu = null;
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
        meterLeft: clamp(Number(extra.meterLeft) || 0, 0, 1),
        meterRight: clamp(Number(extra.meterRight) || 0, 0, 1),
        isMaster: Number(isMaster) === 1
    };
    redraw();
}

function state(
    index,
    value,
    displayValue,
    pan,
    panDisplayValue,
    meterLeft,
    meterRight,
    isSelected,
    color
) {
    var channel = channels[Number(index)];
    if (!channel) {
        return;
    }
    channel.value = clamp(Number(value), 0, 1);
    channel.displayValue = decode(displayValue);
    channel.pan = clamp(Number(pan), 0, 1);
    channel.panDisplayValue = formatPanDisplay(decode(panDisplayValue));
    channel.meterLeft = clamp(Number(meterLeft) || 0, 0, 1);
    channel.meterRight = clamp(Number(meterRight) || 0, 0, 1);
    channel.isSelected = Number(isSelected) === 1;
    channel.color = Number(color) || 0;
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
        begin(message[1]);
    } else if (message[0] === "track") {
        track.apply(this, message.slice(1));
    } else if (message[0] === "trackerror") {
        trackerror(message[1], message[2]);
    } else if (message[0] === "state") {
        state.apply(this, message.slice(1));
    } else if (message[0] === "end") {
        end(message[1]);
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
    drawMeter(channel.meterLeft, railX + 23, geometry);
    drawMeter(channel.meterRight, railX + 29, geometry);
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
    fill(0.32, 0.35, 0.38, 1);
    mgraphics.rectangle(center, y - 3, 1, 11);
    mgraphics.fill();
    var knobX = left + channel.pan * width;
    fill(0.77, 0.79, 0.81, 1);
    mgraphics.rectangle(knobX - 4, y - 4, 8, 13);
    mgraphics.fill();
}

function drawMeter(value, x, geometry) {
    var level = clamp(value, 0, 1);
    if (level <= 0.001) {
        return;
    }
    var db = 20 * Math.log(level) / Math.LN10;
    var normalized = clamp((db + 70) / 76, 0, 1);
    var top = geometry.faderBottom
        - normalized * (geometry.faderBottom - geometry.faderTop);
    var range = geometry.faderBottom - geometry.faderTop;
    var warningY = geometry.faderBottom - (58 / 76) * range;
    var overloadY = geometry.faderBottom - (70 / 76) * range;
    fill(0.08, 0.09, 0.10, 1);
    mgraphics.rectangle(x, geometry.faderTop, 4, geometry.faderBottom - geometry.faderTop);
    mgraphics.fill();
    fill(0.13, 0.76, 0.38, 1);
    mgraphics.rectangle(x, Math.max(top, warningY), 4, geometry.faderBottom - Math.max(top, warningY));
    mgraphics.fill();
    if (top < warningY) {
        var yellowTop = Math.max(top, overloadY);
        fill(0.91, 0.76, 0.20, 1);
        mgraphics.rectangle(x, yellowTop, 4, warningY - yellowTop);
        mgraphics.fill();
    }
    if (top < overloadY) {
        fill(0.92, 0.20, 0.18, 1);
        mgraphics.rectangle(
            x,
            Math.max(top, geometry.faderTop),
            4,
            overloadY - Math.max(top, geometry.faderTop)
        );
        mgraphics.fill();
    } else if (db >= 0) {
        fill(0.92, 0.20, 0.18, 1);
        mgraphics.rectangle(x, overloadY - 2, 4, 4);
        mgraphics.fill();
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
        && channel.hasPan
        && visibleIndex >= 0
        && visibleIndex < geometry.visibleChannels
        && y >= TOP + 239
        && y <= TOP + 263
    ) {
        outlet(0, "selectTrack", channelIndex);
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
        outlet(0, "selectTrack", channelIndex);
        var nub = faderNubBounds(channelIndex, visibleIndex, geometry);
        if (
            x >= nub.left
            && x <= nub.right
            && y >= nub.top
            && y <= nub.bottom
        ) {
            dragIndex = channelIndex;
        }
        return;
    }

    if (
        channel
        && visibleIndex >= 0
        && visibleIndex < geometry.visibleChannels
        && channel.id !== 0
    ) {
        outlet(0, "selectTrack", channelIndex);
    }
}

function ondblclick(x, y, button) {
    var geometry = layout();
    var visibleIndex = Math.floor((x - geometry.left) / geometry.stripWidth);
    var channelIndex = scrollOffset + visibleIndex;
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
    if (
        visibleIndex >= 0
        && visibleIndex < geometry.visibleChannels
        && channels[channelIndex]
        && channels[channelIndex].id !== 0
    ) {
        var nub = faderNubBounds(channelIndex, visibleIndex, geometry);
        if (
            x >= nub.left
            && x <= nub.right
            && y >= nub.top
            && y <= nub.bottom
        ) {
            dragIndex = -1;
            setFader(channelIndex, geometry.faderTop);
        }
    }
}

function ondrag(x, y, button) {
    if (dragIndex >= 0) {
        setFader(dragIndex, y);
    } else if (panDragIndex >= 0) {
        setPan(panDragIndex, x);
    } else if (faderResizeDrag) {
        setFaderTop(y, layout());
    }
}

function onidle(x, y, button) {
    if (button === 0) {
        dragIndex = -1;
        panDragIndex = -1;
        faderResizeDrag = false;
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
        fill(0.13, 0.14, 0.16, 1);
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
    var baseFaderTop = TOP + Math.min(
        290,
        Math.max(260, (HEIGHT - TOP - 100) * 0.48)
    );
    var faderBottom = Math.max(TOP + 324, HEIGHT - 88);
    var minimumFaderTop = TOP + 252;
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
