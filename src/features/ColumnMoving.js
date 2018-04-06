/* eslint-env browser */
/* global requestAnimationFrame */

'use strict';

// This feature is responsible for column drag and drop reordering.
// This object is a mess and desperately needs a complete rewrite.....

var Feature = require('./Feature');

var GRAB = ['grab', '-moz-grab', '-webkit-grab'],
    GRABBING = ['grabbing', '-moz-grabbing', '-webkit-grabbing'],
    setName = function(name) { this.cursor = name; };

var dragger;
var draggerCTX;
var placeholder;
var placeholderCTX;

/**
 * @constructor
 * @extends Feature
 */
var ColumnMoving = Feature.extend('ColumnMoving', {

    /**
     * queue up the animations that need to play so they are done synchronously
     * @type {Array}
     * @memberOf CellMoving.prototype
     */
    floaterAnimationQueue: [],

    /**
     * am I currently auto scrolling right
     * @type {boolean}
     * @memberOf CellMoving.prototype
     */
    columnDragAutoScrollingRight: false,

    /**
     * am I currently auto scrolling left
     * @type {boolean}
     * @memberOf CellMoving.prototype
     */
    columnDragAutoScrollingLeft: false,

    /**
     * am I dragging right now
     * @type {boolean}
     * @memberOf CellMoving.prototype
     */
    dragging: false,

    /**
     * the column index of the currently dragged column
     * @type {number}
     * @memberOf CellMoving.prototype
     */
    dragCol: -1,

    /**
     * an offset to position the dragged item from the cursor
     * @type {number}
     * @memberOf CellMoving.prototype
     */
    dragOffset: 0,

    minScrollDelay: 30,
    maxScrollDelay: 100,
    scrollAttempt: 0,

    /**
     * @memberOf CellMoving.prototype
     * @desc give me an opportunity to initialize stuff on the grid
     * @param {Hypergrid} grid
     */
    initializeOn: function(grid) {
        this.initializeAnimationSupport(grid);
        if (this.next) {
            this.next.initializeOn(grid);
        }
    },

    /**
     * @memberOf CellMoving.prototype
     * @desc initialize animation support on the grid
     * @param {Hypergrid} grid
     */
    initializeAnimationSupport: function(grid) {
        if (!dragger) {
            dragger = document.createElement('canvas');
            dragger.setAttribute('width', '0px');
            dragger.setAttribute('height', '0px');
            dragger.style.position = 'fixed';

            document.body.appendChild(dragger);
            draggerCTX = dragger.getContext('2d', { alpha: false });
        }
        if (!placeholder) {
            placeholder = document.createElement('canvas');
            placeholder.setAttribute('width', '0px');
            placeholder.setAttribute('height', '0px');
            placeholder.style.position = 'fixed';

            document.body.appendChild(placeholder);
            placeholderCTX = placeholder.getContext('2d', { alpha: false });
        }

    },

    /**
     * @memberOf CellMoving.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseDrag: function(grid, event) {

        if (event.isColumnFixed) {
            if (this.next) {
                this.next.handleMouseDrag(grid, event);
            }
            return;
        }

       if (this.next) {
            this.next.handleMouseDrag(grid, event);
        }

        if (this.dragging) {
            this.dragColumn(grid, event);
        }
    },

    /**
     * @memberOf CellMoving.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseDown: function(grid, event) {
        if (
            grid.behavior.isColumnReorderable() &&
            !event.isColumnFixed
        ) {
            if (event.isHeaderCell && !event.isColumnFixed) {
                // start dragging
                var gridCell = event.gridCell;
                this.cursor = GRABBING;
                this.dragging = true;
                this.dragCol = gridCell.x;

                var firstSelectedColumn = grid.getSelectedColumns()[0] ||
                    grid.renderer.visibleColumns.findIndex(function(c) {return c.column === event.column;});
                var hScrollOffset = grid.getHScrollValue();
                var firstSelectedColumnX = grid.renderer.visibleColumns[Math.max(0, firstSelectedColumn - hScrollOffset)].left;

                this.dragOffset = event.primitiveEvent.detail.mouse.x - firstSelectedColumnX;

                this.detachChain();
                this.createDragColumn(grid, this.dragCol);
                this.createPlaceholder(grid, this.dragCol);
                this.dragColumn(grid, event);
            }
        }
        if (this.next) {
            this.next.handleMouseDown(grid, event);
        }
    },

    /**
     * @memberOf CellMoving.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseUp: function(grid, event) {
        //var col = event.gridCell.x;
        if (this.dragging) {
            this.cursor = null;
            //delay here to give other events a chance to be dropped
            var self = this;
            this.endDragColumn(grid);
            setTimeout(function() {
                self.attachChain();
            }, 200);
        }
        this.dragCol = -1;
        this.dragging = false;
        this.cursor = null;
        grid.repaint();

        if (this.next) {
            this.next.handleMouseUp(grid, event);
        }

    },

    /**
     * @memberOf CellMoving.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseMove: function(grid, event) {
        if (
            event.isColumnSelected &&
            grid.behavior.isColumnReorderable() &&
            !event.isColumnFixed &&
            !this.dragging &&
            event.isHeaderCell
            // && event.mousePoint.y < grid.properties.columnGrabMargin
        ) {
            this.cursor = GRAB;
        } else {
            this.cursor = null;
        }

        if (this.next) {
            this.next.handleMouseMove(grid, event);
        }

        if (event.isHeaderCell && this.dragging) {
            this.cursor = GRABBING; //move';
        }
    },

    /**
     * @memberOf CellMoving.prototype
     * @desc this is the main event handler that manages the dragging of the column and moving of placeholder
     * @param {Hypergrid} grid
     */
    movePlaceholderTo: function(grid, overCol) {
        var visibleColumns = grid.renderer.visibleColumns;

        var d = placeholder;
        d.style.display = 'inline';

        var scrollLeft = grid.getHScrollValue();
        var fixedColumnCount = grid.getFixedColumnCount();
        if (overCol < fixedColumnCount) {
            scrollLeft = 0;
        }

        var x;
        if (overCol >= scrollLeft + visibleColumns.length){
            var lastColumn = visibleColumns[visibleColumns.length - 1];
            x = lastColumn.left + lastColumn.width - 3;
        } else {
            x = visibleColumns[overCol - scrollLeft].left;
        }

        this.setCrossBrowserProperty(d, 'transform', 'translate(' + x + 'px, ' + 0 + 'px)');
        grid.repaint();
    },

    /**
     * @memberOf CellMoving.prototype
     * @desc create the placeholder at columnIndex where column(s) should be moved to
     * @param {Hypergrid} grid
     * @param {number} columnIndex - the index of the column after which
     */
    createPlaceholder: function(grid, columnIndex) {
        var fixedColumnCount = grid.getFixedColumnCount();
        var scrollLeft = grid.getHScrollValue();

        if (columnIndex < fixedColumnCount) {
            scrollLeft = 0;
        }

        var width = 3;
        var colHeight = grid.div.clientHeight;
        var d = placeholder;
        var style = d.style;
        var location = grid.div.getBoundingClientRect();

        style.top = location.top + 'px';
        style.left = location.left - 2 + 'px';

        var hdpiRatio = grid.getHiDPI(placeholderCTX);

        d.setAttribute('width', Math.round(width * hdpiRatio) + 'px');
        d.setAttribute('height', Math.round(colHeight * hdpiRatio) + 'px');
        // style.boxShadow = '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)';
        style.width = width + 'px'; //Math.round(columnWidth / hdpiRatio) + 'px';
        style.height = colHeight + 'px'; //Math.round(colHeight / hdpiRatio) + 'px';
        style.backgroundColor = 'rgb(110, 110, 110)';

        var startX = grid.renderer.visibleColumns[columnIndex - scrollLeft].left * hdpiRatio;

        placeholderCTX.scale(hdpiRatio, hdpiRatio);

        grid.renderOverridesCache.floater = {
            columnIndex: columnIndex,
            startX: startX
        };

        style.zIndex = '4';
        GRABBING.forEach(setName, style);
        grid.repaint();
    },

    /**
     * @memberOf CellMoving.prototype
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
     * @memberOf CellMoving.prototype
     * @desc utility function for setting properties on HTMLElements
     * @param {HTMLElement} element - descripton
     * @param {string} property - the property
     * @param {string} value - the value to assign
     */
    setProp: function(element, property, value) {
        if (property in element.style) {
            element.style[property] = value;
        }
    },

    /**
     * @memberOf CellMoving.prototype
     * @desc create the dragged column at columnIndex above the floated column
     * @param {Hypergrid} grid
     * @param {number} columnIndex - the index of the column that will be floating
     */
    createDragColumn: function(grid, columnIndex) {

        var hdpiRatio = grid.getHiDPI(draggerCTX);
        var selectedColumns = grid.getSelectedColumns();
        var consequent = this._isConsequent(selectedColumns);
        var columns = consequent ? selectedColumns : [columnIndex];

        var columnWidth = 0;
        columns.forEach(function(col){
            columnWidth += grid.getColumnWidth(col);
        });

        var colHeight = grid.div.clientHeight;
        var d = dragger;
        var location = grid.div.getBoundingClientRect();
        var style = d.style;
        // offset from top + header height
        var offsetY = grid.getFixedRowsHeight();
        style.top = location.top + offsetY + 'px';
        style.left = location.left + 'px';
        style.opacity = 0.2;
        style.borderTop = '1px solid rgb(51, 153, 255)';
        style.backgroundColor = 'rgb(0, 0, 0)';

        d.setAttribute('width', Math.round(columnWidth * hdpiRatio) + 'px');
        d.setAttribute('height', Math.round(colHeight * hdpiRatio) + 'px');

        style.width = columnWidth + 'px'; //Math.round(columnWidth / hdpiRatio) + 'px';
        style.height = colHeight - offsetY + 'px'; //Math.round(colHeight / hdpiRatio) + 'px';

        draggerCTX.scale(hdpiRatio, hdpiRatio);

        grid.renderOverridesCache.dragger = {
            columnIndex: columnIndex,
            startIndex: columnIndex
        };

        // this.setCrossBrowserProperty(d, 'transform', 'translate(' + x + 'px, -5px)');
        style.zIndex = '5';
        GRABBING.forEach(setName, style);
        grid.repaint();
    },

    /**
     * @memberOf CellMoving.prototype
     * @desc this function is the main dragging logic
     * @param {Hypergrid} grid
     * @param {Object} event - dragging event
     */
    dragColumn: function(grid, event) {

        var x = event.primitiveEvent.detail.mouse.x;
        var distance = x - this.dragOffset;

        var autoScrollingNow = this.columnDragAutoScrollingRight || this.columnDragAutoScrollingLeft;
        var dragColumnIndex = grid.renderOverridesCache.dragger.startIndex;

        var minX = 0;
        var maxX = grid.renderer.getFinalVisibleColumnBoundary();

        var d = dragger;

        this.setCrossBrowserProperty(d, 'transform', 'translate(' + distance + 'px, ' + 0 + 'px)');
        requestAnimationFrame(function() {
            d.style.display = 'inline';
        });

        var threshold = 20;
        if (x < minX + threshold) {
            this.checkAutoScrollToLeft(grid, x);
        }
        if (x > minX + threshold) {
            this.columnDragAutoScrollingLeft = false;
            this.resetScrollDelay();
        }
        if (x > maxX - threshold) {
            this.checkAutoScrollToRight(grid, x);
        }
        if (x < maxX - threshold) {
            this.columnDragAutoScrollingRight = false;
            this.resetScrollDelay();
        }

        var overCol = grid.renderer.getColumnFromPixelX(x);
        var selectedColumns = grid.getSelectedColumns();
        var visibleColumns = grid.renderer.visibleColumns;
        var placeholderCol = -1;
        if (!autoScrollingNow) {
            if (!selectedColumns.slice(1).includes(overCol)){
                grid.renderOverridesCache.dragger.columnIndex = overCol;
                var draggedToTheRight = dragColumnIndex < overCol;
                if (draggedToTheRight) {
                    overCol += 1;
                }
                placeholderCol = overCol;
            } else {
                var firstSelectedColumnIndex = selectedColumns[0];
                var firstVisibleColumnIndex = visibleColumns[0].columnIndex;
                var lastSelectedColumnIndex = selectedColumns[selectedColumns.length - 1] + 2;
                var lastVisibleColumnIndex = visibleColumns[visibleColumns.length - 1].columnIndex;
                if (firstVisibleColumnIndex < firstSelectedColumnIndex) {
                    placeholderCol = firstSelectedColumnIndex;
                } else if (lastVisibleColumnIndex > lastSelectedColumnIndex) {
                    placeholderCol = lastSelectedColumnIndex;
                }
            }
            if (placeholderCol > -1) {
                this.movePlaceholderTo(grid, placeholderCol);
            }
        }
    },

    /**
     * @memberOf CellMoving.prototype
     * @desc resets scroll delay to initial value
     */
    resetScrollDelay: function(){
        this.scrollAttempt = 0;
    },

    /**
     * @memberOf CellMoving.prototype
     * @desc returns delay between auto-scrolling by one step. Delay is decremented with each further step.
     */
    getScrollDelay: function() {
        return Math.max(this.minScrollDelay, this.maxScrollDelay - this.scrollAttempt++ * 5);
    },

    /**
     * @memberOf CellMoving.prototype
     * @desc autoscroll to the right if necessary
     * @param {Hypergrid} grid
     * @param {number} x - the start position
     */
    checkAutoScrollToRight: function(grid, x) {
        if (this.columnDragAutoScrollingRight) {
            return;
        }
        this.columnDragAutoScrollingRight = true;
        this._checkAutoScrollToRight(grid, x);
    },

    _checkAutoScrollToRight: function(grid, x) {
        if (!this.columnDragAutoScrollingRight) {
            return;
        }
        var scrollLeft = grid.getHScrollValue();
        if (!grid.dragging || scrollLeft > (grid.sbHScroller.range.max - 2)) {
            return;
        }
        grid.scrollBy(1, 0);

        var visibleColumns = grid.renderer.visibleColumns;
        var placeholderCol = visibleColumns[visibleColumns.length - 1].columnIndex + 1;
        this.movePlaceholderTo(grid, placeholderCol);

        grid.renderOverridesCache.dragger.columnIndex += 1;
        setTimeout(this._checkAutoScrollToRight.bind(this, grid, x), this.getScrollDelay());
    },

    /**
     * @memberOf CellMoving.prototype
     * @desc autoscroll to the left if necessary
     * @param {Hypergrid} grid
     * @param {number} x - the start position
     */
    checkAutoScrollToLeft: function(grid, x) {
        if (this.columnDragAutoScrollingLeft) {
            return;
        }
        this.columnDragAutoScrollingLeft = true;
        this._checkAutoScrollToLeft(grid, x);
    },

    _checkAutoScrollToLeft: function(grid, x) {
        if (!this.columnDragAutoScrollingLeft) {
            return;
        }
        var scrollLeft = grid.getHScrollValue();
        if (!grid.dragging || scrollLeft < 1) {
            return;
        }
        grid.scrollBy(-1, 0);

        var visibleColumns = grid.renderer.visibleColumns;
        var placeholderCol = visibleColumns[0].columnIndex - 1;
        this.movePlaceholderTo(grid, placeholderCol);

        grid.renderOverridesCache.dragger.columnIndex -= 1;
        setTimeout(this._checkAutoScrollToLeft.bind(this, grid, x), this.getScrollDelay());
    },

    /**
     * @memberOf CellMoving.prototype
     * @desc a column drag has completed, update data and cleanup
     * @param {Hypergrid} grid
     */
    endDragColumn: function(grid) {

        var d = dragger;
        var changed = grid.renderOverridesCache.dragger.startIndex !== grid.renderOverridesCache.dragger.columnIndex;

        var selectedColumns = grid.getSelectedColumns();
        var consequent = this._isConsequent(selectedColumns);

        var placeholderIndex = grid.renderOverridesCache.dragger.columnIndex;
        var draggerIndex = grid.renderOverridesCache.dragger.startIndex;
        var from = consequent ? selectedColumns[0] : [draggerIndex];
        var len = consequent ? selectedColumns.length : 1;
        grid.moveColumns(from, len, placeholderIndex);

        var f = placeholder;
        requestAnimationFrame(function() {
            f.style.display = 'none';
        });

        grid.renderOverridesCache.dragger = null;
        grid.repaint();

        grid.clearSelections();
        var startNewSelectionFrom;
        if (from < placeholderIndex){
            startNewSelectionFrom = placeholderIndex - (len - 1);
        } else {
            startNewSelectionFrom = placeholderIndex;
        }
        grid.selectColumn(startNewSelectionFrom, startNewSelectionFrom + (len - 1));

        requestAnimationFrame(function() {
            d.style.display = 'none';
            grid.endDragColumnNotification(); //internal notification
            if (changed){
                grid.fireSyntheticOnColumnsChangedEvent(); //public notification
            }
        });

    },

    _isConsequent: function(arr){
        var consequent = true;
        if (arr.length > 1) {
            arr.sort();
            for (var i = 0; i < arr.length - 1; i++) {
                if (arr[i + 1] - arr[i] !== 1){
                    consequent = false;
                }
            }
        }
        return consequent;
    }

});

module.exports = ColumnMoving;
