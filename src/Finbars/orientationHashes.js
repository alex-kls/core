'use strict';

/* eslint-env node, browser */

module.exports = {
    vertical: {
        coordinate: 'clientY',
        axis: 'pageY',
        size: 'height',
        outside: 'right',
        inside: 'left',
        leading: 'top',
        trailing: 'bottom',
        marginLeading: 'marginTop',
        marginTrailing: 'marginBottom',
        thickness: 'width',
        delta: 'deltaY',
        // gridOffsetProperty: 'canvasWidthOffset',
        containerTouchVelocityModifier: 4.2,
        containerTouchVelocityMax: 20000,
        touchScrollOffsetCoefficient: 1
    },
    horizontal: {
        coordinate: 'clientX',
        axis: 'pageX',
        size: 'width',
        outside: 'bottom',
        inside: 'top',
        leading: 'left',
        trailing: 'right',
        marginLeading: 'marginLeft',
        marginTrailing: 'marginRight',
        thickness: 'height',
        delta: 'deltaX',
        // gridOffsetProperty: 'canvasHeightOffset'
        containerTouchVelocityModifier: 4.5,
        containerTouchVelocityMax: 20000,
        touchScrollOffsetCoefficient: 1.5
    }
};
