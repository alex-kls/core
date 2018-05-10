'use strict';

var Feature = require('./Feature');

/**
 * @constructor
 * @extends Feature
 */
var CellSelection = Feature.extend('CellSelection', {

    /**
     * The pixel location of the mouse pointer during a drag operation.
     * @type {Point}
     * @memberOf CellSelection.prototype
     */
    currentDrag: null,

    /**
     * the cell coordinates of the where the mouse pointer is during a drag operation
     * @type {Object}
     * @memberOf CellSelection.prototype
     */
    lastDragCell: null,

    /**
     * a millisecond value representing the previous time an autoscroll started
     * @type {number}
     * @default 0
     * @memberOf CellSelection.prototype
     */
    sbLastAuto: 0,

    /**
     * a millisecond value representing the time the current autoscroll started
     * @type {number}
     * @default 0
     * @memberOf CellSelection.prototype
     */
    sbAutoStart: 0,

    /**
     * @memberOf CellSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseUp: function(grid, event) {
        if (this.dragging) {
            this.dragging = false;
        }
        if (this.next) {
            this.next.handleMouseUp(grid, event);
        }
    },

    /**
     * @memberOf CellSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseDown: function(grid, event) {
        let dx, dy;
        grid.behavior.getHeaderColumnByName();
        if (event.isColspanedByLeftColumn && event.colspanMainColumnName) {
            let mainColumn = grid.behavior.getHeaderColumnByName(event.colspanMainColumnName);
            let mainColumnIndex = grid.behavior.columns.indexOf(mainColumn);

            if (mainColumn && mainColumnIndex) {
                dx = mainColumnIndex;
            }
        } else if (event.rowspanMainRow !== undefined && event.rowspanMainRow !== null) {
            dy = event.rowspanMainRow;
        }

        dx = dx !== undefined ? dx : event.dataCell.x;
        dy = dy !== undefined ? dy : event.dataCell.y;
        let isSelectable = grid.behavior.getCellProperty(dx, dy, 'cellSelection');

        if (isSelectable && event.isDataCell) {
            if (event.primitiveEvent.detail.isRightClick && event.isCellSelected) {
                return;
            }
            let dCell = grid.newPoint(dx, dy),
                primEvent = event.primitiveEvent,
                keys = primEvent.detail.keys;
            this.dragging = true;
            this.extendSelection(grid, dCell, keys);
        }

        if (this.next) {
            this.next.handleMouseDown(grid, event);
        }
    },

    /**
     * @memberOf CellSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleMouseDrag: function(grid, event) {
        if (this.dragging && grid.properties.cellSelection && !event.primitiveEvent.detail.isRightClick) {
            this.currentDrag = event.primitiveEvent.detail.mouse;
            this.lastDragCell = grid.newPoint(event.gridCell.x, event.dataCell.y);
            this.checkDragScroll(grid, this.currentDrag);
            this.handleMouseDragCellSelection(grid, this.lastDragCell, event.primitiveEvent.detail.keys);
        } else if (this.next) {
            this.next.handleMouseDrag(grid, event);
        }
    },

    /**
     * @memberOf CellSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleKeyDown: function(grid, event) {
        let cellEvent = grid.getGridCellFromLastSelection(true);
        const detail = event.detail,
            keys = detail.currentKeys;
        const ctrlPressed = event.metaKey
            || event.ctrlKey
            || keys.indexOf('CTRL') >= 0
            || keys.indexOf('COMMANDLEFT') >= 0
            || keys.indexOf('COMMANDRIGHT') >= 0;
        const navKey = cellEvent && (
                cellEvent.properties.mappedNavKey(detail.char, ctrlPressed) ||
                cellEvent.properties.navKey(detail.char, ctrlPressed)
            );

        const handler = (ctrlPressed && this['handleCTRL' + navKey]) ? this['handleCTRL' + navKey] : this['handle' + navKey];

        // STEP 1: Move the selection
        if (handler) {
            handler.call(this, grid, detail);

            // STEP 2: Open the cell editor at the new position if it has `editOnNextCell` and is `editable`
            cellEvent = grid.getGridCellFromLastSelection(true); // new cell
            if (cellEvent.properties.editOnNextCell) {
                grid.editAt(cellEvent); // succeeds only if `editable`
            }

            // STEP 3: If editor not opened on new cell, take focus
            if (!grid.cellEditor) {
                grid.takeFocus();
            }

            if (event.detail.sourceEvent && event.detail.sourceEvent.preventDefault) {
                event.detail.sourceEvent.preventDefault();
            }
        } else if (this.next) {
            this.next.handleKeyDown(grid, event);
        }
    },

    /**
     * @memberOf CellSelection.prototype
     * @desc Handle a mousedrag selection.
     * @param {Hypergrid} grid
     * @param {Object} gridCell - grid cell
     * @param {Array} keys - array of the keys that are currently pressed down
     */
    handleMouseDragCellSelection: function(grid, gridCell, keys) {
        const x = Math.max(0, gridCell.x),
            y = Math.max(0, gridCell.y),
            previousDragExtent = grid.getDragExtent(),
            mouseDown = grid.getMouseDown(),
            newX = x - mouseDown.x,
            newY = y - mouseDown.y;

        if (previousDragExtent.x === newX && previousDragExtent.y === newY) {
            return;
        }

        grid.clearMostRecentSelection();

        grid.select(mouseDown.x, mouseDown.y, newX, newY);
        grid.setDragExtent(grid.newPoint(newX, newY));

        grid.repaint();
    },

    /**
     * @memberOf CellSelection.prototype
     * @desc this checks while were dragging if we go outside the visible bounds, if so, kick off the external autoscroll check function (above)
     * @param {Hypergrid} grid
     * @param {Object} mouse - the event details
     */
    checkDragScroll: function(grid, mouse) {
        if (!grid.properties.scrollingEnabled) {
            return;
        }
        const b = grid.getDataBounds();
        const inside = b.contains(mouse);
        if (inside) {
            if (grid.isScrollingNow()) {
                grid.setScrollingNow(false);
            }
        } else if (!grid.isScrollingNow()) {
            grid.setScrollingNow(true);
            this.scrollDrag(grid);
        }
    },

    /**
     * @memberOf CellSelection.prototype
     * @desc this function makes sure that while we are dragging outside of the grid visible bounds, we scroll accordingly
     * @param {Hypergrid} grid
     */
    scrollDrag: function(grid) {
        if (!grid.isScrollingNow()) {
            return;
        }

        let dragStartedInHeaderArea = grid.isMouseDownInHeaderArea(),
            lastDragCell = this.lastDragCell,
            b = grid.getDataBounds(),

            xOffset = 0,
            yOffset = 0,

            numFixedColumns = grid.getFixedColumnCount(),
            numFixedRows = grid.getFixedRowCount(),

            dragEndInFixedAreaX = lastDragCell.x < numFixedColumns,
            dragEndInFixedAreaY = lastDragCell.y < numFixedRows;

        if (!dragStartedInHeaderArea) {
            if (this.currentDrag.x < b.origin.x) {
                xOffset = -1;
            }
            if (this.currentDrag.y < b.origin.y) {
                yOffset = -1;
            }
        }
        if (this.currentDrag.x > b.origin.x + b.extent.x) {
            xOffset = 1;
        }
        if (this.currentDrag.y > b.origin.y + b.extent.y) {
            yOffset = 1;
        }

        let dragCellOffsetX = xOffset;
        let dragCellOffsetY = yOffset;

        if (dragEndInFixedAreaX) {
            dragCellOffsetX = 0;
        }
        if (dragEndInFixedAreaY) {
            dragCellOffsetY = 0;
        }

        this.lastDragCell = lastDragCell.plusXY(dragCellOffsetX, dragCellOffsetY);
        grid.scrollBy(xOffset, yOffset);
        this.handleMouseDragCellSelection(grid, lastDragCell, []); // update the selection
        grid.repaint();
        setTimeout(this.scrollDrag.bind(this, grid), 25);
    },

    /**
     * @memberOf CellSelection.prototype
     * @desc extend a selection or create one if there isnt yet
     * @param {Hypergrid} grid
     * @param {Object} gridCell - the event details
     * @param {Array} keys - array of the keys that are currently pressed down
     */
    extendSelection: function(grid, gridCell, keys) {
        const hasCTRL = keys.indexOf('CTRL') >= 0 || keys.indexOf('COMMANDLEFT') >= 0 || keys.indexOf('COMMANDRIGHT') >= 0,
            hasSHIFT = keys.indexOf('SHIFT') >= 0,
            mousePoint = grid.getMouseDown(),
            x = gridCell.x, // - numFixedColumns + scrollLeft;
            y = gridCell.y; // - numFixedRows + scrollTop;

        //were outside of the grid do nothing
        if (x < 0 || y < 0) {
            return;
        }

        //we have repeated a click in the same spot deslect the value from last time
        if (
            hasCTRL &&
            x === mousePoint.x &&
            y === mousePoint.y
        ) {
            grid.clearMostRecentSelection();
            grid.popMouseDown();
            grid.repaint();
            return;
        }

        if (!hasCTRL && !hasSHIFT) {
            grid.clearSelections();
        }

        if (hasSHIFT) {
            grid.clearMostRecentSelection();
            grid.select(mousePoint.x, mousePoint.y, x - mousePoint.x, y - mousePoint.y);
            grid.setDragExtent(grid.newPoint(x - mousePoint.x, y - mousePoint.y));
        } else {
            grid.select(x, y, 0, 0);
            grid.setMouseDown(grid.newPoint(x, y));
            grid.setDragExtent(grid.newPoint(0, 0));
        }
        grid.repaint();
    },

    /**
     * @memberOf CellSelection.prototype
     * @param {Hypergrid} grid
     */
    handleDOWNSHIFT: function(grid) {
        this.moveShiftSelect(grid, 0, 1);
    },

    /**
     * @memberOf CellSelection.prototype
     * @param {Hypergrid} grid
     */
    handleUPSHIFT: function(grid) {
        this.moveShiftSelect(grid, 0, -1);
    },

    /**
     * @memberOf CellSelection.prototype
     * @param {Hypergrid} grid
     */
    handleLEFTSHIFT: function(grid) {
        this.moveShiftSelect(grid, -1, 0);
    },

    /**
     * @memberOf CellSelection.prototype
     * @param {Hypergrid} grid
     */
    handleRIGHTSHIFT: function(grid) {
        this.moveShiftSelect(grid, 1, 0);
    },

    /**
     * @private
     * @memberOf CellSelection.prototype
     * @param grid
     * @param selection
     * @return {boolean}
     * @private
     */
    _isSelectionInsideDataArea: function(grid, selection){
        const maxColumnWithContent = grid.behavior.dataModel.getColumnsWithValuesCount();
        const maxRowWithContent = grid.behavior.dataModel.getRowsWithValuesCount();

        return selection.corner.x <= (maxColumnWithContent - 1)
            && selection.corner.y <= maxRowWithContent;
    },

    /**
     * @private
     * @memberOf CellSelection.prototype
     * @param grid
     * @param selection
     * @return {boolean}
     * @private
     */
    _isSelectionAlreadyOnFictiveHeaderRow: function(grid, selection){
        return selection.origin.y < grid.getFictiveHeaderRowsCount();
    },

    /**
     * @private
     * @memberOf CellSelection.prototype
     * @param grid
     * @param selection
     * @return {boolean}
     * @private
     */
    _isSelectionAlreadyOnFirstDataRow: function(grid, selection){
        return selection.origin.y === grid.getFictiveHeaderRowsCount()
            || selection.corner.y === grid.getFictiveHeaderRowsCount();
    },

    /**
     * @private
     * @memberOf CellSelection.prototype
     * @param grid
     * @param selection
     * @return {boolean}
     * @private
     */
    _isSelectionAlreadyOnLastDataRow: function(grid, selection) {
        const maxRowWithContent = grid.behavior.dataModel.getRowsWithValuesCount();
        return selection.corner.y === maxRowWithContent + grid.getFictiveHeaderRowsCount() - 1;
    },

    /**
     * @private
     * @memberOf CellSelection.prototype
     * @param grid
     * @param selection
     * @return {boolean}
     * @private
     */
    _isSelectionAlreadyOnLastDataColumn: function(grid, selection) {
        const maxColumnWithContent = grid.behavior.dataModel.getColumnsWithValuesCount();
        return selection.corner.x === maxColumnWithContent - 1;
    },

    /**
     * @private
     * @memberOf CellSelection.prototype
     * @param grid
     * @param selection
     * @return {boolean}
     * @private
     */
    _isSelectionAlreadyOnLastDataColumnAndRow: function(grid, selection) {
        return this._isSelectionAlreadyOnLastDataRow(grid, selection)
            && this._isSelectionAlreadyOnLastDataColumn(grid, selection);
    },

    /**
     * @private
     * @memberOf CellSelection.prototype
     * @param grid
     * @param selection
     * @return {boolean}
     * @private
     */
    _isSelectionAlreadyOnFirstCell: function(grid, selection) {
        return selection.origin.x <= 0 && selection.origin.y <= grid.getFictiveHeaderRowsCount();
    },

    /**
     * @memberOf CellSelection.prototype
     * @param {Hypergrid} grid
     */
    handleCTRLa: function(grid) {
        const oldLastSelection = grid.selectionModel.getLastSelection();
        const maxColumnWithContent = grid.behavior.dataModel.getColumnsWithValuesCount();
        const maxRowWithContent = grid.behavior.dataModel.getRowsWithValuesCount();
        const fictiveHeaderRowsCount = grid.getFictiveHeaderRowsCount();

        let newSelectionOriginX = 0, newSelectionOriginY = 0, newSelectionCornerX = 0,  newSelectionCornerY = 0;

        if (this._isSelectionInsideDataArea(grid, oldLastSelection)
            && !(this._isSelectionAlreadyOnLastDataColumnAndRow(grid, oldLastSelection)
                && this._isSelectionAlreadyOnFirstCell(grid, oldLastSelection))) {
            newSelectionOriginX = 0;
            newSelectionOriginY = fictiveHeaderRowsCount;
            newSelectionCornerX = maxColumnWithContent - 1;
            newSelectionCornerY = maxRowWithContent - 1;
        } else {
            newSelectionOriginX = 0;
            newSelectionOriginY = 0;
            newSelectionCornerX = grid.getColumnCount();
            newSelectionCornerY = grid.getRowCount();
        }

        if (this._isSelectionAlreadyOnFictiveHeaderRow(grid, oldLastSelection)
            || grid.properties.selectFictiveHeaderCellsAsRegular) {
            newSelectionOriginY = 0;
            newSelectionCornerY += grid.getFictiveHeaderRowsCount();
        }

        grid.clearMostRecentSelection();
        grid.select(newSelectionOriginX, newSelectionOriginY, newSelectionCornerX, newSelectionCornerY);
        grid.setMouseDown(grid.newPoint(newSelectionOriginX, newSelectionOriginY));
        grid.setDragExtent(grid.newPoint(newSelectionCornerX, newSelectionCornerY));
        // const newLastSelection = grid.selectionModel.getLastSelection();
        // newLastSelection.firstSelectedCell = oldLastSelection.firstSelectedCell;
        grid.repaint();
    },

    /**
     * @memberOf CellSelection.prototype
     * @param {Hypergrid} grid
     */
    handleCTRLUP: function(grid) {
        const lastSelection = grid.selectionModel.getLastSelection();
        const maxRowWithContent = grid.behavior.dataModel.getRowsWithValuesCount();

        if (!this._isSelectionInsideDataArea(grid, lastSelection)
            || grid.properties.ignoreDataCellsOnVerticalCtrlSelection) {
            if (lastSelection.origin.x >= grid.behavior.dataModel.getColumnsWithValuesCount()
                || grid.properties.ignoreDataCellsOnVerticalCtrlSelection) {
                grid.moveSingleSelect(0, - Math.max(lastSelection.corner.y, lastSelection.origin.y));
            } else {
                grid.moveSingleSelect(0, - (Math.max(lastSelection.corner.y, lastSelection.origin.y) - maxRowWithContent));
            }
        } else {
            if (this._isSelectionAlreadyOnFictiveHeaderRow(grid, lastSelection)
                || this._isSelectionAlreadyOnFirstDataRow(grid, lastSelection)
                || grid.properties.selectFictiveHeaderCellsAsRegular) {
                grid.moveSingleSelect(0, - Math.max(lastSelection.corner.y, lastSelection.origin.y));
            } else {
                grid.moveSingleSelect(0, - (Math.max(lastSelection.corner.y, lastSelection.origin.y) - grid.getFictiveHeaderRowsCount()));
            }
        }
    },

    /**
     * @memberOf CellSelection.prototype
     * @param {Hypergrid} grid
     */
    handleCTRLDOWN: function(grid) {
        const lastSelection = grid.selectionModel.getLastSelection();
        const maxRowWithContent = grid.behavior.dataModel.getRowsWithValuesCount();

        if (!this._isSelectionInsideDataArea(grid, lastSelection)
            || this._isSelectionAlreadyOnLastDataRow(grid, lastSelection)
            || lastSelection.origin.x > grid.behavior.dataModel.getColumnsWithValuesCount()
            || grid.properties.ignoreDataCellsOnVerticalCtrlSelection) {
            grid.moveSingleSelect(0, grid.getRowCount() - lastSelection.lastSelectedCell.y);
        } else {
            if (this._isSelectionAlreadyOnFictiveHeaderRow(grid, lastSelection)
                && !this._isSelectionAlreadyOnFirstDataRow(grid, lastSelection)
                && !grid.properties.selectFictiveHeaderCellsAsRegular) {
                grid.moveSingleSelect(0, grid.getFictiveHeaderRowsCount() - lastSelection.lastSelectedCell.y);
            } else {
                grid.moveSingleSelect(0, maxRowWithContent - lastSelection.lastSelectedCell.y);
            }
        }
    },

    /**
     * @memberOf CellSelection.prototype
     * @param {Hypergrid} grid
     */
    handleCTRLRIGHT: function(grid) {
        const lastSelection = grid.selectionModel.getLastSelection();
        const maxColumnWithContent = grid.behavior.dataModel.getColumnsWithValuesCount();

        if (!this._isSelectionInsideDataArea(grid, lastSelection)
            || this._isSelectionAlreadyOnLastDataColumn(grid, lastSelection)) {
            grid.moveSingleSelect((grid.getColumnCount() - lastSelection.origin.x), 0);
        } else {
            grid.moveSingleSelect(((maxColumnWithContent - 1) - lastSelection.origin.x), 0);
        }
    },

    /**
     * @memberOf CellSelection.prototype
     * @param {Hypergrid} grid
     */
    handleCTRLLEFT: function(grid) {
        const lastSelection = grid.selectionModel.getLastSelection();
        const maxColumnWithContent = grid.behavior.dataModel.getColumnsWithValuesCount();

        if (this._isSelectionInsideDataArea(grid, lastSelection)
            || this._isSelectionAlreadyOnLastDataColumn(grid, lastSelection)) {
            grid.moveSingleSelect(-lastSelection.corner.x, 0);
        } else {
            grid.moveSingleSelect(-(lastSelection.corner.x - (maxColumnWithContent - 1)), 0);
        }
    },

    /**
     * @memberOf CellSelection.prototype
     * @param {Hypergrid} grid
     */
    handleCTRLUPSHIFT: function(grid) {
        const lastSelection = grid.selectionModel.getLastSelection();
        const maxRowWithContent = grid.behavior.dataModel.getRowsWithValuesCount();


        if (!this._isSelectionInsideDataArea(grid, lastSelection)
            || grid.properties.ignoreDataCellsOnVerticalCtrlSelection) {
            if (lastSelection.origin.x >= grid.behavior.dataModel.getColumnsWithValuesCount()
                || grid.properties.ignoreDataCellsOnVerticalCtrlSelection) {
                this.moveShiftSelect(grid, 0, - Math.max(lastSelection.corner.y, lastSelection.origin.y));
            } else {
                this.moveShiftSelect(grid, 0, - (Math.max(lastSelection.corner.y, lastSelection.origin.y) - maxRowWithContent));
            }
        } else {
            if (this._isSelectionAlreadyOnFictiveHeaderRow(grid, lastSelection)
                || this._isSelectionAlreadyOnFirstDataRow(grid, lastSelection)
                || grid.properties.selectFictiveHeaderCellsAsRegular) {
                this.moveShiftSelect(grid, 0, - Math.max(lastSelection.corner.y, lastSelection.origin.y));
            } else {
                this.moveShiftSelect(grid, 0, - (Math.max(lastSelection.corner.y, lastSelection.origin.y) - grid.getFictiveHeaderRowsCount()));
            }
        }
    },

    /**
     * @memberOf CellSelection.prototype
     * @param {Hypergrid} grid
     */
    handleCTRLDOWNSHIFT: function(grid) {
        const lastSelection = grid.selectionModel.getLastSelection();
        const maxRowWithContent = grid.behavior.dataModel.getRowsWithValuesCount();

        if (!this._isSelectionInsideDataArea(grid, lastSelection)
            || this._isSelectionAlreadyOnLastDataRow(grid, lastSelection)
            || lastSelection.origin.x > grid.behavior.dataModel.getColumnsWithValuesCount()
            || grid.properties.ignoreDataCellsOnVerticalCtrlSelection) {
            this.moveShiftSelect(grid, 0, grid.getRowCount() - lastSelection.lastSelectedCell.y);
        } else {
            this.moveShiftSelect(grid, 0, maxRowWithContent - lastSelection.lastSelectedCell.y);
        }
    },

    /**
     * @memberOf CellSelection.prototype
     * @param {Hypergrid} grid
     */
    handleCTRLRIGHTSHIFT: function(grid) {
        const lastSelection = grid.selectionModel.getLastSelection();
        const maxColumnWithContent = grid.behavior.dataModel.getColumnsWithValuesCount();

        if (!this._isSelectionInsideDataArea(grid, lastSelection)
            || this._isSelectionAlreadyOnLastDataColumn(grid, lastSelection)) {
            this.moveShiftSelect(grid, (grid.getColumnCount() - lastSelection.origin.x), 0);
        } else {
            this.moveShiftSelect(grid, ((maxColumnWithContent - 1) - lastSelection.origin.x), 0);
        }
    },

    /**
     * @memberOf CellSelection.prototype
     * @param {Hypergrid} grid
     */
    handleCTRLLEFTSHIFT: function(grid) {
        const lastSelection = grid.selectionModel.getLastSelection();
        const maxColumnWithContent = grid.behavior.dataModel.getColumnsWithValuesCount();

        if (this._isSelectionInsideDataArea(grid, lastSelection)
            || this._isSelectionAlreadyOnLastDataColumn(grid, lastSelection)) {
            this.moveShiftSelect(grid, -lastSelection.corner.x, 0);
        } else {
            this.moveShiftSelect(grid, -(lastSelection.corner.x - (maxColumnWithContent - 1)), 0);
        }
    },

    /**
     * @memberOf CellSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleDOWN: function(grid, event) {
        //keep the browser viewport from auto scrolling on key event
        event.primitiveEvent.preventDefault();

        const count = this.getAutoScrollAcceleration();
        grid.moveSingleSelect(0, count);
    },

    /**
     * @memberOf CellSelection.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     */
    handleUP: function(grid, event) {
        //keep the browser viewport from auto scrolling on key event
        event.primitiveEvent.preventDefault();

        const count = this.getAutoScrollAcceleration();
        grid.moveSingleSelect(0, -count);
    },

    /**
     * @memberOf CellSelection.prototype
     * @param {Hypergrid} grid
     */
    handleLEFT: function(grid) {
        grid.moveSingleSelect(-1, 0);
    },

    /**
     * @memberOf CellSelection.prototype
     * @param {Hypergrid} grid
     */
    handleRIGHT: function(grid) {
        grid.moveSingleSelect(1, 0);
    },

    /**
     * @memberOf CellSelection.prototype
     * @desc If we are holding down the same navigation key, accelerate the increment we scroll
     * #### returns: integer
     */
    getAutoScrollAcceleration: function() {
        const elapsed = this.getAutoScrollDuration() / 2000;
        return Math.max(1, Math.floor(elapsed * elapsed * elapsed * elapsed));
    },

    /**
     * @memberOf CellSelection.prototype
     * @desc set the start time to right now when we initiate an auto scroll
     */
    setAutoScrollStartTime: function() {
        this.sbAutoStart = Date.now();
    },

    /**
     * @memberOf CellSelection.prototype
     * @desc update the autoscroll start time if we haven't autoscrolled within the last 500ms otherwise update the current autoscroll time
     */
    pingAutoScroll: function() {
        const now = Date.now();
        if (now - this.sbLastAuto > 500) {
            this.setAutoScrollStartTime();
        }
        this.sbLastAuto = Date.now();
    },

    /**
     * @memberOf CellSelection.prototype
     * @desc answer how long we have been auto scrolling
     * #### returns: integer
     */
    getAutoScrollDuration: function() {
        if (Date.now() - this.sbLastAuto > 500) {
            return 0;
        }
        return Date.now() - this.sbAutoStart;
    },

    /**
     * @memberOf CellSelection.prototype
     * @desc Augment the most recent selection extent by (offsetX,offsetY) and scroll if necessary.
     * @param {Hypergrid} grid
     * @param {number} offsetX - x coordinate to start at
     * @param {number} offsetY - y coordinate to start at
     */
    moveShiftSelect: function(grid, offsetX, offsetY) {
        if (grid.extendSelect(offsetX, offsetY)) {
            this.pingAutoScroll();
        }
    }

});

module.exports = CellSelection;
