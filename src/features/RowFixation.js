/* eslint-env browser */
/* global requestAnimationFrame */

'use strict';

// This feature is responsible for column drag and drop reordering.
// This object is a mess and desperately needs a complete rewrite.....

var Feature = require('./Feature');

var GRAB = ['grab', '-moz-grab', '-webkit-grab'],
    GRABBING = ['grabbing', '-moz-grabbing', '-webkit-grabbing'];
// setName = function(name) { this.cursor = name; };

var dragger;
var draggerCTX;
var placeholder;
var placeholderCTX;

/**
 * @constructor
 * @extends Feature
 */
var RowFixation = Feature.extend('RowFixation', {
    /**
     * @type {boolean}
     * @memberOf RowFixation.prototype
     */
    dragging: false,

    /**
     * an offset to position the dragger from the cursor
     * @type {number}
     * @memberOf RowFixation.prototype
     */
    dragOffset: 0,

    /**
     * current position (index) of an placeholder
     * @type {number}
     * @memberOf RowFixation.prototype
     */
    currentPlaceholderColumnPos: -1,

    /**
     * @memberOf RowFixation.prototype
     * @desc fired every time when grid rendered
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleGridRendered: function(grid, event){
        this.initializeAnimationSupport(grid);

        if (this.next) {
            this.next.handleGridRendered(grid);
        }
    },

    /**
     * @memberOf RowFixation.prototype
     * @desc initialize animation support on the grid
     * @param {Hypergrid} grid
     */
    initializeAnimationSupport: function(grid) {
        if (!dragger) {
            dragger = document.createElement('canvas');
            dragger.setAttribute('width', '0px');
            dragger.setAttribute('height', '0px');
            dragger.style.position = 'fixed';
            dragger.style.pointerEvents = 'none';

            document.body.appendChild(dragger);
            draggerCTX = dragger.getContext('2d');
        }
        if (!placeholder) {
            placeholder = document.createElement('canvas');
            placeholder.setAttribute('width', '0px');
            placeholder.setAttribute('height', '0px');
            placeholder.style.position = 'fixed';

            document.body.appendChild(placeholder);
            placeholderCTX = placeholder.getContext('2d');
        }
    },

    /**
     * @memberOf RowFixation.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseDrag: function(grid, event) {
        if (this.dragging) {
            this.moveDragger(grid, event);
        }

        if (this.next) {
            this.next.handleMouseDrag(grid, event);
        }
    },

    /**
     * @memberOf RowFixation.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseDown: function(grid, event) {
        if (this.overAreaDivider(grid, event) && !this.dragging){
            this.cursor = GRABBING;
            this.dragging = true;

            this.createPlaceholder(grid);
            this.createDragger(grid);
            this.dragOffset = dragger.getBoundingClientRect().left;
        } else if (this.next) {
            this.next.handleMouseDown(grid, event);
        }
    },

    /**
     * @memberOf RowFixation.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseUp: function(grid, event) {
        if (this.dragging) {
            this.cursor = null;
            this.performFixation(grid);
        }
        this.dragging = false;
        this.cursor = null;

        if (this.next) {
            this.next.handleMouseUp(grid, event);
        }
    },

    /**
     * @memberOf RowFixation.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseMove: function(grid, event) {
        this.cursor = null;

        if (!this.dragging && this.overAreaDivider(grid, event)) {
            this.cursor = GRAB;
        } else if (this.next) {
            this.next.handleMouseMove(grid, event);
        }
    },

    /**
     * @memberOf ColumnResizing.prototype
     * @desc returns the index of which divider I'm over
     * @returns {boolean}
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    overAreaDivider: function(grid, event) {
        var isFirstColumnAfterFixed = (event.dataCell.y === (grid.properties.fixedColumnCount)) && event.isHeaderCell;
        if (!isFirstColumnAfterFixed) {
            return false;
        }

        return (event.mousePoint.y >= (0 - grid.properties.fixedLinesVWidth) && (event.mousePoint.y <= 0));
    },

    /**
     * @memberOf RowFixation.prototype
     * @desc utility function to move dragger based on current cursor position
     * @param {Hypergrid} grid
     * @param {Object} event - dragging event
     */
    moveDragger: function(grid, event) {
        var distance = event.primitiveEvent.detail.mouse.x - this.dragOffset;
        this.setCrossBrowserProperty(dragger, 'transform', 'translate(' + distance + 'px, ' + 0 + 'px)');

        var nearestColumnIndex = this.getNearestColumnIndex(grid, event.primitiveEvent.detail.mouse.x);
        if (nearestColumnIndex && nearestColumnIndex !== this.currentPlaceholderColumnPos) {
            this.movePlaceholderTo(grid, nearestColumnIndex);
            this.currentPlaceholderColumnPos = nearestColumnIndex;
        }
    },

    /**
     * @memberOf RowFixation.prototype
     * @desc utility function to move placeholder to the start coordinates of column
     * @param {Hypergrid} grid
     * @param {number} column
     */
    movePlaceholderTo: function(grid, column) {
        placeholder.style.display = 'inline';
        var scrollLeft = grid.getHScrollValue();

        var newStartX = (grid.renderer.visibleColumns[column].left) + scrollLeft + 3;

        placeholder.style.left = newStartX + 'px';
    },

    /**
     * @memberOf RowFixation.prototype
     * @desc create the placeholder based on current count of fixed columns
     * @param {Hypergrid} grid
     */
    createPlaceholder: function(grid) {
        var width = grid.properties.fixedLinesHWidth;
        var gridHeight = grid.div.clientHeight;
        var hdpiRatio = grid.getHiDPI(placeholderCTX);
        var headerHeight = grid.getRowHeight(0);

        var d = placeholder;
        var style = d.style;
        var location = grid.div.getBoundingClientRect();

        style.top = location.top + 'px';

        d.setAttribute('width', Math.round(width * hdpiRatio) + 'px');
        d.setAttribute('height', Math.round(gridHeight * hdpiRatio) + 'px');
        d.style.display = 'inline';

        placeholderCTX.fillStyle = '#659DFC';
        placeholderCTX.fillRect(0, 0, width, headerHeight);
        placeholderCTX.fillStyle = '#AFBBD1';
        placeholderCTX.fillRect(0, headerHeight, width, gridHeight);

        placeholderCTX.scale(hdpiRatio, hdpiRatio);

        style.zIndex = '4';

        this.movePlaceholderTo(grid, grid.getFixedColumnCount());
    },

    /**
     * @memberOf RowFixation.prototype
     * @desc utility function for setting cross browser css properties
     * @param {HTMLElement} element - descripton
     * @param {string} property - the property
     * @param {string} value - the value to assign
     */
    setCrossBrowserProperty: function(element, property, value) {
        var uProperty = property[0].toUpperCase() + property.substr(1);
        this.setProp(element, 'webkit' + uProperty, value);
        this.setProp(element, 'Moz' + uProperty, value);
        this.setProp(element, 'ms' + uProperty, value);
        this.setProp(element, 'O' + uProperty, value);
        this.setProp(element, property, value);
    },

    /**
     * @memberOf RowFixation.prototype
     * @desc create the dragged column based on current count of fixed columns
     * @param {Hypergrid} grid
     */
    createDragger: function(grid) {
        var width = grid.properties.fixedLinesHWidth;
        var scrollLeft = grid.getHScrollValue();
        var startX = (grid.renderer.visibleColumns[grid.properties.fixedColumnCount].left) + scrollLeft + 2;
        var headerHeight = grid.getRowHeight(0);
        var gridHeight = grid.div.clientHeight;

        dragger = document.createElement('canvas');
        draggerCTX = dragger.getContext('2d');
        var hdpiRatio = grid.getHiDPI(draggerCTX);
        var location = grid.div.getBoundingClientRect();

        dragger.setAttribute('width', (width * hdpiRatio) + 'px');
        dragger.setAttribute('height', (gridHeight * hdpiRatio) + 'px');
        dragger.style.position = 'fixed';
        dragger.style.top = location.top + 'px';
        dragger.style.left = startX + 'px';
        dragger.style.display = 'inline';

        document.body.appendChild(dragger);

        draggerCTX.clearRect(0, 0, width, gridHeight);
        draggerCTX.fillStyle = '#BCBCBC';
        draggerCTX.fillRect(0, 0, width, headerHeight);

        draggerCTX.fillStyle = '#AFBBD1';
        draggerCTX.fillRect(0, headerHeight, width, gridHeight);
    },

    /**
     * @memberOf RowFixation.prototype
     * @desc utility method to set grid options when dragging ends
     * @param {Hypergrid} grid
     */
    performFixation: function(grid) {
        grid.addProperties({
            fixedColumnCount: this.currentPlaceholderColumnPos
        });

        placeholder.style.display = 'none';
        dragger.style.display = 'none';
    },

    /**
     * @memberOf RowFixation.prototype
     * @desc utility function to get nearest possible index from an cursor position
     * @param {Hypergrid} grid
     * @param {number} x - horizontal cursor position
     */
    getNearestColumnIndex: function(grid, x){
        var columnUnderCursorIndex = grid.renderer.getColumnFromPixelX(x);
        var visibleColumns = grid.renderer.visibleColumns;

        var offset = 0;

        var max = grid.getVisibleColumnsCount();
        var columnStartX = visibleColumns[Math.min(max, columnUnderCursorIndex - offset)].left;
        var columnEndX = visibleColumns[Math.min(max, columnUnderCursorIndex - offset)].right;

        var res = columnUnderCursorIndex;

        if (Math.abs(columnStartX - x) >= Math.abs(columnEndX - x)) {
            res += 1;
        }

        if (res === visibleColumns[visibleColumns.length - 1].columnIndex) {
            res -= 1;
        }

        return res;
    }
});

module.exports = RowFixation;
