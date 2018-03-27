'use strict';

var CellRenderer = require('./CellRenderer');

/**
 * @constructor
 * @desc A rendering of the last Selection Model
 * @extends CellRenderer
 */
var LastSelection = CellRenderer.extend('LastSelection', {
    paint: function(gc, config) {
        var visOverlay = gc.alpha(config.selectionRegionOverlayColor) > 0,
            visOutline = gc.alpha(config.selectionRegionOutlineColor) > 0;

        if (visOverlay || visOutline) {
            var x = config.bounds.x,
                y = config.bounds.y,
                width = config.bounds.width,
                height = config.bounds.height;

            if (visOverlay) {
                gc.beginPath();

                gc.rect(x, y, width, height);

                gc.cache.fillStyle = config.selectionRegionOverlayColor;
                gc.fill();

                gc.closePath();
            }

            if (visOutline) {
                drawRectBorder(gc,
                    x - 1,
                    y - 1,
                    width + 1,
                    height + 1,
                    config.selectionRegionOutlineColor,
                    config.selectionRegionBorderWidth);
            }
        }
    }
});

module.exports = LastSelection;

function drawRectBorder(ctx, x, y, width, height, color, lineWidth) {
    ctx.cache.fillStyle = color;
    ctx.fillRect(x, y, lineWidth, height);
    ctx.fillRect(x, y, width, lineWidth);
    ctx.fillRect(x + width, y, lineWidth, height);
    ctx.fillRect(x, y + height, width + 1, lineWidth);
}
