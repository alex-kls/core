/* eslint-env browser */
/* global requestAnimationFrame */

'use strict';

// This feature is responsible for column drag and drop reordering.
// This object is a mess and desperately needs a complete rewrite.....

var Feature = require('./Feature');

var canDragCursorName = '-webkit-grab',
    draggingCursorName = '-webkit-grabbing';

var columnAnimationTime = 150;
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
     * is the drag mechanism currently enabled ("armed")
     * @type {boolean}
     * @memberOf CellMoving.prototype
     */
    dragArmed: false,

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
     * @memberOf CellMoving.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseDrag: function(grid, event) {

        var gridCell = event.gridCell;
        var x;
        //var y;

        var distance = Math.abs(event.primitiveEvent.detail.dragstart.x - event.primitiveEvent.detail.mouse.x);

        if (distance < 10 || event.isColumnFixed) {
            if (this.next) {
                this.next.handleMouseDrag(grid, event);
            }
            return;
        }

        if (event.isHeaderCell && this.dragArmed && !this.dragging) {
            this.dragging = true;
            this.dragCol = gridCell.x;
            this.dragOffset = event.mousePoint.x;
            this.detachChain();
            x = event.primitiveEvent.detail.mouse.x;
            //y = event.primitiveEvent.detail.mouse.y;
            this.createDragColumn(grid, x, this.dragCol);
            this.createPlaceholder(grid, this.dragCol);
        } else if (this.next) {
            this.next.handleMouseDrag(grid, event);
        }

        if (this.dragging) {
            x = event.primitiveEvent.detail.mouse.x;
            //y = event.primitiveEvent.detail.mouse.y;
            this.dragColumn(grid, x);
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
            if (event.isHeaderCell) {
                this.dragArmed = true;
                this.cursor = draggingCursorName;
                // grid.clearSelections();
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
        this.dragArmed = false;
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
            this.cursor = canDragCursorName;
        } else {
            this.cursor = null;
        }

        if (this.next) {
            this.next.handleMouseMove(grid, event);
        }

        if (event.isHeaderCell && this.dragging) {
            this.cursor = draggingCursorName; //move';
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
        if(overCol >= scrollLeft + visibleColumns.length){
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
        style.cursor = draggingCursorName;
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
     * @param {number} x - the start position
     * @param {number} columnIndex - the index of the column that will be floating
     */
    createDragColumn: function(grid, x, columnIndex) {

        var fixedColumnCount = grid.getFixedColumnCount();
        var scrollLeft = grid.getHScrollValue();

        if (columnIndex < fixedColumnCount) {
            scrollLeft = 0;
        }

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
        style.cursor = draggingCursorName;
        grid.repaint();
    },

    /**
     * @memberOf CellMoving.prototype
     * @desc this function is the main dragging logic
     * @param {Hypergrid} grid
     * @param {number} x - the start position
     */
    dragColumn: function(grid, x) {

        //TODO: this function is overly complex, refactor this in to something more reasonable
        var self = this;

        var autoScrollingNow = this.columnDragAutoScrollingRight || this.columnDragAutoScrollingLeft;
        var dragColumnIndex = grid.renderOverridesCache.dragger.startIndex;

        var minX = 0;
        var maxX = grid.renderer.getFinalVisibleColumnBoundary();

        var d = dragger;

        this.setCrossBrowserProperty(d, 'transition', (self.isWebkit ? '-webkit-' : '') + 'transform ' + 0 + 'ms ease, box-shadow ' + columnAnimationTime + 'ms ease');

        this.setCrossBrowserProperty(d, 'transform', 'translate(' + x + 'px, ' + 0 + 'px)');
        requestAnimationFrame(function() {
            d.style.display = 'inline';
        });

        var overCol = grid.renderer.getColumnFromPixelX(x);

        if (x < minX + 10) {
            this.checkAutoScrollToLeft(grid, x);
        }
        if (x > minX + 10) {
            this.columnDragAutoScrollingLeft = false;
        }
        if (x > maxX - 10) {
            this.checkAutoScrollToRight(grid, x);
        }
        if (x < maxX - 10) {
            this.columnDragAutoScrollingRight = false;
        }

        var selectedColumns = grid.getSelectedColumns();
        if(!autoScrollingNow && !selectedColumns.splice(1).includes(overCol)) {
            grid.renderOverridesCache.dragger.columnIndex = overCol;
            var draggedToTheRight = dragColumnIndex < overCol;
            if (draggedToTheRight) {
                overCol += 1;
            }
            this.movePlaceholderTo(grid, overCol);
        }
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
        grid.renderOverridesCache.dragger.columnIndex += 1;
        setTimeout(this._checkAutoScrollToRight.bind(this, grid, x), 150);
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
        grid.renderOverridesCache.dragger.columnIndex -= 1;
        setTimeout(this._checkAutoScrollToLeft.bind(this, grid, x), 150);
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
        if(from < placeholderIndex){
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
        if(arr.length > 1) {
            arr.sort();
            for (var i = 0; i < arr.length - 1; i++) {
                if(arr[i + 1] - arr[i] != 1){
                    consequent = false;
                }
            }
        }
        return consequent;
    }

});

module.exports = ColumnMoving;
