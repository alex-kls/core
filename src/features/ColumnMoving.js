/* eslint-env browser */
/* global requestAnimationFrame */

'use strict';

// This feature is responsible for column drag and drop reordering.
// This object is a mess and desperately needs a complete rewrite.....

const Feature = require('./Feature');

const GRAB = ['grab', '-moz-grab', '-webkit-grab'],
    GRABBING = ['grabbing', '-moz-grabbing', '-webkit-grabbing'],
    setName = function(name) { this.cursor = name; };

let dragger,
    draggerCTX,
    placeholder,
    placeholderCTX;

/**
 * @constructor
 * @extends Feature
 */
const ColumnMoving = Feature.extend('ColumnMoving', {

    /**
     * queue up the animations that need to play so they are done synchronously
     * @type {Array}
     * @memberOf ColumnMoving.prototype
     */
    floaterAnimationQueue: [],

    /**
     * am I currently auto scrolling right
     * @type {boolean}
     * @memberOf ColumnMoving.prototype
     */
    columnDragAutoScrollingRight: false,

    /**
     * am I currently auto scrolling left
     * @type {boolean}
     * @memberOf ColumnMoving.prototype
     */
    columnDragAutoScrollingLeft: false,

    /**
     * am I dragging right now
     * @type {boolean}
     * @memberOf ColumnMoving.prototype
     */
    dragging: false,

    /**
     * the column index of the currently dragged column
     * @type {number}
     * @memberOf ColumnMoving.prototype
     */
    dragCol: -1,

    /**
     * an offset to position the dragged item from the cursor
     * @type {number}
     * @memberOf ColumnMoving.prototype
     */
    dragOffset: 0,

    minScrollDelay: 30,
    maxScrollDelay: 100,
    scrollAttempt: 0,

    /**
     * @memberOf ColumnMoving.prototype
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
     * @memberOf ColumnMoving.prototype
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
            draggerCTX = dragger.getContext('2d', { alpha: true });
        }
        if (!placeholder) {
            placeholder = document.createElement('canvas');
            placeholder.setAttribute('width', '0px');
            placeholder.setAttribute('height', '0px');
            placeholder.style.position = 'fixed';

            document.body.appendChild(placeholder);
            placeholderCTX = placeholder.getContext('2d', { alpha: true });
        }

    },

    /**
     * @memberOf ColumnMoving.prototype
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
     * @memberOf ColumnMoving.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseDown: function(grid, event) {
        if (
            grid.behavior.isColumnReorderable() &&
            !event.isColumnFixed &&
            event.isHeaderCell &&
            !event.isColumnFixed &&
            !event.primitiveEvent.detail.isRightClick
        ) {
            // start dragging
            const gridCell = event.gridCell;
            this.cursor = GRABBING;
            this.dragging = true;
            this.dragCol = gridCell.x;

            const firstSelectedColumn = grid.getSelectedColumns()[0] ||
                grid.renderer.visibleColumns.findIndex(function(c) {return c.column === event.column;});
            const hScrollOffset = grid.getHScrollValue();
            const firstSelectedColumnX = grid.renderer.visibleColumns[Math.max(0, firstSelectedColumn - hScrollOffset)].left;

            this.dragOffset = event.primitiveEvent.detail.mouse.x - firstSelectedColumnX;

            this.detachChain();
            this.createDragColumn(grid, this.dragCol);
            this.createPlaceholder(grid, this.dragCol);
            this.dragColumn(grid, event);
        }
        if (this.next) {
            this.next.handleMouseDown(grid, event);
        }
    },

    /**
     * @memberOf ColumnMoving.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseUp: function(grid, event) {
        //var col = event.gridCell.x;
        if (this.dragging) {
            this.cursor = null;
            //delay here to give other events a chance to be dropped
            const self = this;
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
     * @memberOf ColumnMoving.prototype
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
     * @memberOf ColumnMoving.prototype
     * @desc this is the main event handler that manages the dragging of the column and moving of placeholder
     * @param {Hypergrid} grid
     */
    movePlaceholderTo: function(grid, overCol) {
        const placeholderLineWidth = grid.properties.columnMoveInsertLineWidth;
        const visibleColumns = grid.renderer.visibleColumns;

        const d = placeholder;
        d.style.display = 'inline';

        let scrollLeft = grid.getHScrollValue();
        const fixedColumnCount = grid.getFixedColumnCount();
        if (overCol < fixedColumnCount) {
            scrollLeft = 0;
        }

        let x;
        if (overCol >= scrollLeft + visibleColumns.length){
            const lastColumn = visibleColumns[visibleColumns.length - 1];
            x = lastColumn.left + lastColumn.width;
        } else {
            let supportingColumn = visibleColumns[overCol - scrollLeft];
            if (!supportingColumn) {
                return;
            }
            x = supportingColumn.left + placeholderLineWidth / 2;
        }

        this.setCrossBrowserProperty(d, 'transform', 'translate(' + x + 'px, ' + 0 + 'px)');
        grid.repaint();
    },

    /**
     * @memberOf ColumnMoving.prototype
     * @desc create the placeholder at columnIndex where column(s) should be moved to
     * @param {Hypergrid} grid
     * @param {number} columnIndex - the index of the column after which
     */
    createPlaceholder: function(grid, columnIndex) {
        const fixedColumnCount = grid.getFixedColumnCount();
        let scrollLeft = grid.getHScrollValue();

        if (columnIndex < fixedColumnCount) {
            scrollLeft = 0;
        }

        const width = grid.properties.columnMoveInsertLineWidth;
        let colHeight = grid.div.clientHeight;
        const d = placeholder;
        const style = d.style;
        const location = grid.div.getBoundingClientRect();

        let heightToSkip = 0;
        const rowsToSkip = grid.getHeaderRowCount();
        for (let i = 0; i < rowsToSkip; i++) {
            heightToSkip += grid.getRowHeight(i);
        }
        if (grid.properties.gridLinesH && grid.properties.gridLinesWidth) {
            heightToSkip += grid.properties.gridLinesWidth;
        }
        colHeight -= heightToSkip;

        style.top = (location.top + heightToSkip) + 'px';
        style.left = location.left - 2 + 'px';

        const hdpiRatio = grid.getHiDPI(placeholderCTX);

        d.setAttribute('width', Math.round(width * hdpiRatio) + 'px');
        d.setAttribute('height', Math.round(colHeight * hdpiRatio) + 'px');
        // style.boxShadow = '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)';
        style.width = width + 'px'; //Math.round(columnWidth / hdpiRatio) + 'px';
        style.height = colHeight + 'px'; //Math.round(colHeight / hdpiRatio) + 'px';
        style.backgroundColor = grid.properties.columnMoveInsertLineColor;

        let startX = grid.renderer.visibleColumns[columnIndex - scrollLeft].left * hdpiRatio;

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
     * @memberOf ColumnMoving.prototype
     * @desc utility function for setting cross browser css properties
     * @param {HTMLElement} element - descripton
     * @param {string} property - the property
     * @param {string} value - the value to assign
     */
    setCrossBrowserProperty: function(element, property, value) {
        const uProperty = property[0].toUpperCase() + property.substr(1);
        this.setProp(element, 'webkit' + uProperty, value);
        this.setProp(element, 'Moz' + uProperty, value);
        this.setProp(element, 'ms' + uProperty, value);
        this.setProp(element, 'O' + uProperty, value);
        this.setProp(element, property, value);
    },

    /**
     * @memberOf ColumnMoving.prototype
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
     * @memberOf ColumnMoving.prototype
     * @desc create the dragged column at columnIndex above the floated column
     * @param {Hypergrid} grid
     * @param {number} columnIndex - the index of the column that will be floating
     */
    createDragColumn: function(grid, columnIndex) {
        const hdpiRatio = grid.getHiDPI(draggerCTX);
        const selectedColumns = grid.getSelectedColumns();
        const consequent = this._isConsequent(selectedColumns);
        const columns = consequent ? selectedColumns : [columnIndex];

        let columnWidth = 0;
        columns.forEach(function(col){
            columnWidth += grid.getColumnWidth(col);
        });

        const colHeight = grid.div.clientHeight;
        const d = dragger;
        const location = grid.div.getBoundingClientRect();
        const style = d.style;
        // offset from top + header height
        const offsetY = grid.getFixedRowsHeight();
        style.top = location.top + offsetY + 'px';
        style.left = location.left + 'px';
        style.opacity = 0.15;
        style.border = '1px solid #4285F4';
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
     * @memberOf ColumnMoving.prototype
     * @desc this function is the main dragging logic
     * @param {Hypergrid} grid
     * @param {Object} event - dragging event
     */
    dragColumn: function(grid, event) {
        const x = event.primitiveEvent.detail.mouse.x;
        const distance = x - this.dragOffset;

        const autoScrollingNow = this.columnDragAutoScrollingRight || this.columnDragAutoScrollingLeft;
        const dragColumnIndex = grid.renderOverridesCache.dragger.startIndex;

        const minX = 0;
        const maxX = grid.renderer.getFinalVisibleColumnBoundary();

        const d = dragger;

        this.setCrossBrowserProperty(d, 'transform', 'translate(' + distance + 'px, ' + 0 + 'px)');
        requestAnimationFrame(function() {
            d.style.display = 'inline';
        });

        const threshold = 20;
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

        let overCol = grid.renderer.getColumnFromPixelX(x);
        const selectedColumns = grid.getSelectedColumns();
        const visibleColumns = grid.renderer.visibleColumns;
        let placeholderCol = -1;
        if (!autoScrollingNow) {
            if (!selectedColumns.slice(1).includes(overCol)){
                grid.renderOverridesCache.dragger.columnIndex = overCol;
                const draggedToTheRight = dragColumnIndex < overCol;
                if (draggedToTheRight) {
                    overCol += 1;
                }
                placeholderCol = overCol;
            } else {
                const firstSelectedColumnIndex = selectedColumns[0];
                const firstVisibleColumnIndex = visibleColumns[0].columnIndex;
                const lastSelectedColumnIndex = selectedColumns[selectedColumns.length - 1] + 2;
                const lastVisibleColumnIndex = visibleColumns[visibleColumns.length - 1].columnIndex;
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
     * @memberOf ColumnMoving.prototype
     * @desc resets scroll delay to initial value
     */
    resetScrollDelay: function(){
        this.scrollAttempt = 0;
    },

    /**
     * @memberOf ColumnMoving.prototype
     * @desc returns delay between auto-scrolling by one step. Delay is decremented with each further step.
     */
    getScrollDelay: function() {
        return Math.max(this.minScrollDelay, this.maxScrollDelay - this.scrollAttempt++ * 5);
    },

    /**
     * @memberOf ColumnMoving.prototype
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
        const scrollLeft = grid.getHScrollValue();
        if (!grid.dragging || scrollLeft > (grid.sbHScroller.range.max - 2)) {
            return;
        }
        grid.scrollBy(1, 0);

        const visibleColumns = grid.renderer.visibleColumns;
        const placeholderCol = visibleColumns[visibleColumns.length - 1].columnIndex + 1;
        this.movePlaceholderTo(grid, placeholderCol);

        grid.renderOverridesCache.dragger.columnIndex += 1;
        setTimeout(this._checkAutoScrollToRight.bind(this, grid, x), this.getScrollDelay());
    },

    /**
     * @memberOf ColumnMoving.prototype
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
        const scrollLeft = grid.getHScrollValue();
        if (!grid.dragging || scrollLeft < 1) {
            return;
        }
        grid.scrollBy(-1, 0);

        const visibleColumns = grid.renderer.visibleColumns;
        const placeholderCol = visibleColumns[0].columnIndex - 1;
        this.movePlaceholderTo(grid, placeholderCol);

        grid.renderOverridesCache.dragger.columnIndex -= 1;
        setTimeout(this._checkAutoScrollToLeft.bind(this, grid, x), this.getScrollDelay());
    },

    /**
     * @memberOf ColumnMoving.prototype
     * @desc a column drag has completed, update data and cleanup
     * @param {Hypergrid} grid
     */
    endDragColumn: function(grid) {
        const d = dragger;
        const changed = grid.renderOverridesCache.dragger.startIndex !== grid.renderOverridesCache.dragger.columnIndex;

        const selectedColumns = grid.getSelectedColumns();
        const consequent = this._isConsequent(selectedColumns);

        const placeholderIndex = grid.renderOverridesCache.dragger.columnIndex;
        const draggerIndex = grid.renderOverridesCache.dragger.startIndex;
        const from = consequent ? selectedColumns[0] : [draggerIndex];
        const len = consequent ? selectedColumns.length : 1;
        grid.moveColumns(from, len, placeholderIndex);

        const f = placeholder;
        requestAnimationFrame(function() {
            f.style.display = 'none';
        });

        grid.renderOverridesCache.dragger = null;
        grid.repaint();

        grid.clearSelections();
        let startNewSelectionFrom;
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
        let consequent = true;
        if (arr.length > 1) {
            arr.sort();
            for (let i = 0; i < arr.length - 1; i++) {
                if (arr[i + 1] - arr[i] !== 1){
                    consequent = false;
                }
            }
        }
        return consequent;
    }

});

module.exports = ColumnMoving;
