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
        // gridOffsetProperty: 'canvasWidthOffset'
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
    }
};
