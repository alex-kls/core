'use strict';
/* eslint-env browser */

const Scrollbar = require('./modules').Scrollbar;

/**
 * @summary Scrollbar support.
 * @desc Hypergrid/index.js mixes this module into its prototype.
 * @mixin
 */
exports.mixin = {

    /**
     * A float value between 0.0 - 1.0 of the vertical scroll position.
     * @type {number}
     * @memberOf Hypergrid#
     */
    vScrollValue: 0,

    /**
     * A float value between 0.0 - 1.0 of the horizontal scroll position.
     * @type {number}
     * @memberOf Hypergrid#
     */
    hScrollValue: 0,

    /**
     * @property {FinBar} sbVScroller - An instance of {@link https://github.com/openfin/finbars|FinBar}.
     * @memberOf Hypergrid#
     */
    sbVScroller: null,

    /**
     * The previous value of sbVScrollVal.
     * @type {number}
     * @memberOf Hypergrid#
     */
    sbPrevVScrollValue: 0,

    /**
     * The previous value of sbHScrollValue.
     * @type {number}
     * @memberOf Hypergrid#
     */
    sbPrevHScrollValue: 0,

    scrollingNow: false,

    /**
     * @memberOf Hypergrid#
     * @summary Set for `scrollingNow` field.
     * @param {boolean} isItNow - The type of event we are interested in.
     */
    setScrollingNow: function(isItNow) {
        this.scrollingNow = isItNow;
    },

    /**
     * @memberOf Hypergrid#
     * @returns {boolean} The `scrollingNow` field.
     */
    isScrollingNow: function() {
        return this.scrollingNow;
    },

    /**
     * @memberOf Hypergrid#
     * @summary Scroll horizontal and vertically by the provided offsets.
     * @param {number} offsetX - Scroll in the x direction this much.
     * @param {number} offsetY - Scroll in the y direction this much.
     */
    scrollBy: function(offsetX, offsetY) {
        this.scrollHBy(offsetX);
        this.scrollVBy(offsetY);
    },

    /**
     * @memberOf Hypergrid#
     * @summary Scroll vertically by the provided offset.
     * @param {number} offsetY - Scroll in the y direction this much.
     */
    scrollVBy: function(offsetY) {
        const max = this.sbVScroller.range.max;
        const oldValue = this.vScrollValue;
        const oldOffset = this.getVScrollValue();
        const rowHeight = this.behavior.getRowHeight(Math.max(0, oldOffset + offsetY));
        const newValue = Math.min(max, oldValue + offsetY * rowHeight);
        if (newValue !== oldValue) {
            this.setVScrollValue(newValue);
        }
    },

    /**
     * @memberOf Hypergrid#
     * @summary Scroll horizontally by the provided offset.
     * @param {number} offsetX - Scroll in the x direction this much.
     */
    scrollHBy: function(offsetX) {
        const max = this.sbHScroller.range.max;
        const oldValue = this.hScrollValue;
        const oldOffset = this.getHScrollValue();
        const newValue = Math.min(max, oldValue + offsetX * this.behavior.getColumnWidth(Math.max(0, oldOffset + offsetX)));
        if (newValue !== oldValue) {
            this.setHScrollValue(newValue);
        }
    },

    scrollToMakeVisible: function(column, row) {
        const { origin, corner } = this.renderer.dataWindow;
        const { fixedColumnCount, fixedRowCount } = this.properties;

        let delta;
        let pxDelta = 0;

        // scroll only if target not in fixed columns
        if (column >= fixedColumnCount) {
            delta = column - origin.x;
            // target is to left of scrollable columns; negative delta scrolls left
            if (delta < 0) {
                pxDelta = 0;
                for (let i = 0; i <= Math.abs(delta) + 1; i++) {
                    pxDelta += this.getColumnWidth(origin.x - i);
                }

                this.sbHScroller.index -= pxDelta;
            }

            delta = column - corner.x;
            if (delta >= 0) {
                pxDelta = 0;
                // scroll more than just one cut column
                for (let i = 0; i <= Math.abs(delta) + 2; i++) {
                    pxDelta += this.getColumnWidth(corner.x - i);
                }

                this.sbHScroller.index += pxDelta;
            }
        }

        if (this.sbHScroller.index <= this.getColumnWidth(0)) {
            this.sbHScroller.index = 0;
        }

        // scroll only if target not in fixed rows
        if (row >= fixedRowCount) {
            delta = row - origin.y;
            // target is above scrollable rows; negative delta scrolls up
            if (delta < 0) {
                const deltaPercent = (Math.abs(delta) + 2) / this.getRowCount();
                pxDelta = this.sbVScroller.max * deltaPercent;

                if (pxDelta < this.properties.defaultRowHeight * 3) {
                    this.sbVScroller.index -= pxDelta;
                } else {
                    delta = row - corner.y;

                    const deltaPercent = (Math.abs(delta) + 2) / this.getRowCount();
                    pxDelta = this.sbVScroller.max * deltaPercent;
                    this.sbVScroller.index -= pxDelta;
                }
            }

            delta = row - corner.y;
            if (delta >= 0) {
                const deltaPercent = (delta + 2) / this.getRowCount();
                pxDelta = this.sbVScroller.max * deltaPercent;

                if (pxDelta < this.properties.defaultRowHeight * 3) {
                    this.sbVScroller.index += pxDelta;
                } else {
                    delta = origin.y - row;

                    const deltaPercent = (Math.abs(delta) + 2) / this.getRowCount();
                    pxDelta = this.sbVScroller.max * deltaPercent;
                    this.sbVScroller.index += pxDelta;
                }
            }
        }

        if (this.sbVScroller.index <= this.getRowHeight(0)) {
            this.sbVScroller.index = 0;
        }
    },

    selectCellAndScrollToMakeVisible: function(c, r) {
        this.scrollToMakeVisible(c, r);
        this.selectCell(c, r, true);
    },

    /**
     * @summary binary search of cell with needed scroll parameters
     * @param scrollValue - scroll value in pixels
     * @param from - first cell index for searching
     * @param to - last cell index for searching
     * @param checkFunction - function for checking height of horizontal or certical scroll
     */
    findCellByScrollValue: function(scrollValue, from, to, checkFunction) {
        const search = Math.round((from + to) / 2);

        if (search === from || search === to) {
            return from;
        }

        const currentHeight = checkFunction.call(this.behavior, search);

        if (currentHeight > scrollValue) {
            return this.findCellByScrollValue(scrollValue, from, search, checkFunction);
        } else {
            return this.findCellByScrollValue(scrollValue, search, to, checkFunction);
        }
    },

    /**
     * @memberOf Hypergrid#
     * @desc Set the vertical scroll value.
     * @param {number} newValue - The new scroll value.
     */
    setVScrollValue: function(newValue) {
        newValue = Math.min(this.sbVScroller.range.max, Math.max(0, Math.round(newValue)));
        if (newValue !== this.vScrollValue) {
            this.behavior.setScrollPositionY(newValue);
            this.behavior.changed();
            const oldY = this.vScrollValue;

            this.vScrollValue = newValue;
            this.scrollValueChangedNotification();
            setTimeout(()=> {
                // self.sbVRangeAdapter.subjectChanged();
                this.fireScrollEvent('fin-scroll-y', oldY, newValue);
            });
        }
        // update scrollbar
        if (this.sbVScroller.index !== newValue) {
            this.sbVScroller.index = newValue;
        }
    },

    /**
     * @memberOf Hypergrid#
     * @return {number} The vertical scroll value.
     */
    getVScrollValue: function() {
        return this.findCellByScrollValue(this.vScrollValue, 0, this.getRowCount(), this.behavior.getRowsHeight);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Set the horizontal scroll value.
     * @param {number} newValue - The new scroll value.
     */
    setHScrollValue: function(newValue) {
        const self = this;
        newValue = Math.min(this.sbHScroller.range.max, Math.max(0, Math.round(newValue)));
        if (newValue !== this.hScrollValue) {
            this.behavior.setScrollPositionX(newValue);
            this.behavior.changed();
            const oldX = this.hScrollValue;
            this.hScrollValue = newValue;
            this.scrollValueChangedNotification();

            if (this.sbHScroller) {
                this.sbHScroller.index = newValue;
            }

            setTimeout(function() {
                //self.sbHRangeAdapter.subjectChanged();
                self.fireScrollEvent('fin-scroll-x', oldX, newValue);
                //self.synchronizeScrollingBoundaries(); // todo: Commented off to prevent the grid from bouncing back, but there may be repercussions...
            });
        }
        // update scrollbar
        if (this.sbHScroller.index !== newValue) {
            this.sbHScroller.index = newValue;
        }
    },

    /**
     * @memberOf Hypergrid#
     * @returns The horizontal scroll value.
     */
    getHScrollValue: function() {
        return this.findCellByScrollValue(this.hScrollValue, 0, this.getColumnCount(), this.behavior.getColumnsWidth);
    },

    /**
     * @memberOf Hypergrid#
     * @desc Initialize the scroll bars.
     */
    initScrollbars: function() {
        if (this.sbHScroller && this.sbVScroller) {
            return;
        }

        const self = this;

        const horzBar = new Scrollbar({
            orientation: 'horizontal',
            onBarVisibilityChanged: function(isVisible) {
                self.properties.canvasHeightOffset = isVisible
                    ? Number(window.getComputedStyle(this.mountDiv).height.replace('px', ''))
                    : 0;
                self.canvas.resize(false);
            },
            onchange: self.setHScrollValue.bind(self),
            cssStylesheetReferenceElement: this.div,
            paging: {
                up: self.pageLeft.bind(self),
                down: self.pageRight.bind(self)
            }
        });

        const vertBar = new Scrollbar({
            orientation: 'vertical',
            onBarVisibilityChanged: function(isVisible) {
                self.properties.canvasWidthOffset = isVisible
                    ? Number(window.getComputedStyle(this.mountDiv).width.replace('px', ''))
                    : 0;
                self.canvas.resize(false);
            },
            onchange: self.setVScrollValue.bind(self),
            paging: {
                up: self.pageUp.bind(self),
                down: self.pageDown.bind(self)
            }
        });

        this.sbHScroller = horzBar;
        this.sbVScroller = vertBar;

        const hPrefix = this.properties.hScrollbarClassPrefix;
        const vPrefix = this.properties.vScrollbarClassPrefix;

        if (hPrefix && hPrefix !== '') {
            this.sbHScroller.classPrefix = hPrefix;
        }

        if (vPrefix && vPrefix !== '') {
            this.sbVScroller.classPrefix = vPrefix;
        }

        this.div.appendChild(horzBar.mountDiv);
        this.div.appendChild(vertBar.mountDiv);

        this.synchronizeScrollbarsVisualization();
    },

    destroyScrollbars: function() {
        if (this.sbHScroller) {
            this.sbHScroller.remove();
            delete this.sbHScroller;
        }
        if (this.sbVScroller) {
            this.sbVScroller.remove();
            delete this.sbVScroller;
        }
    },

    synchronizeScrollbarsVisualization: function() {
        if (this.sbHScroller) {
            this.sbHScroller
                .shortenEndByValue('leading', this.getHScrollbarLeftMargin())
                .shortenEndByValue('trailing', this.getHScrollbarRightMargin() - 1)
                .resize(null, null, this.getFullContentWidth());

            this.sbHScroller.style = this.properties.scrollbarHStyle;
            this.sbHScroller.thumbStyle = this.properties.scrollbarHThumbStyle;
            this.sbHScroller.mountStyle = this.properties.scrollbarHMountStyle;
        }
        if (this.sbVScroller) {
            this.sbVScroller
                .shortenEndByValue('leading', this.getVScrollbarTopMargin())
                .shortenEndByValue('trailing', this.getVScrollbarBottomMargin() - 1)
                .resize(null, null, this.getFullContentHeight());

            this.sbVScroller.style = this.properties.scrollbarVStyle;
            this.sbVScroller.thumbStyle = this.properties.scrollbarVThumbStyle;
            this.sbVScroller.mountStyle = this.properties.scrollbarVMountStyle;
        }
    },

    getHScrollbarLeftMargin: function() {
        let res = 0;
        const visibleColumns = this.renderer.visibleColumns;
        res -= this.properties.gridLinesV ? this.properties.gridLinesWidth : 0;
        res += this.properties.gridBorderLeft ? this.properties.gridLinesWidth : 0;

        const neededColumn = visibleColumns[this.behavior.rowColumnIndex];
        res += this.properties.rowHeaderNumbers && neededColumn
            ? neededColumn.right
            : 0;

        for (let i = 0; i < this.properties.fixedColumnCount; i++) {
            if (i !== this.behavior.rowColumnIndex) {
                res += this.getColumnWidth(i);
            }
        }

        res += this.properties.fixedColumnCount ? this.properties.fixedLinesVWidth : 0;

        return res;
    },

    getHScrollbarRightMargin: function() {
        let res = -1;

        if (this.properties.scrollbarVStyle && this.properties.scrollbarVStyle.width) {
            res += this.properties.scrollbarVStyle.width;
        }

        return res;
    },

    getVScrollbarTopMargin: function() {
        let res;
        const rowIndex = this.properties.fixedRowCount;

        let row = this.renderer.visibleRows[rowIndex];
        if (!row) {
            row = this.renderer.visibleRows[0];
        }
        res = row ? row.bottom : 0;

        res -= this.properties.gridLinesH ? this.properties.gridLinesWidth : 0;

        res += this.properties.fixedRowCount ? this.properties.fixedLinesHWidth : 0;

        res += this.properties.gridBorderTop ? this.properties.fixedLinesHWidth : 0;

        // to fully implement google sheets style
        res += 1;

        return res;
    },

    getVScrollbarBottomMargin: function() {
        let res = -1;

        if (this.properties.scrollbarHStyle && this.properties.scrollbarHStyle.height) {
            res += this.properties.scrollbarHStyle.height;
        }

        return res;
    },

    getFullContentWidth: function() {
        let res = 0;

        for (let i = 0; i <= this.getColumnCount(); i++){
            res += this.getColumnWidth(i);
        }

        return res;
    },
    getFullContentHeight: function() {
        let res = 0;

        for (let i = 0; i <= this.getRowCount(); i++){
            res += this.getRowHeight(i);
        }

        return res;
    },
    /**
     * @memberOf Hypergrid#
     * @desc Scroll values have changed, we've been notified.
     */
    setVScrollbarValues: function(max) {
        this.sbVScroller.range = {
            min: 0,
            max: max
        };
    },

    setHScrollbarValues: function(max) {
        this.sbHScroller.range = {
            min: 0,
            max: max
        };
    },

    scrollValueChangedNotification: function() {
        if (
            this.hScrollValue !== this.sbPrevHScrollValue ||
            this.vScrollValue !== this.sbPrevVScrollValue
        ) {
            this.sbPrevHScrollValue = this.hScrollValue;
            this.sbPrevVScrollValue = this.vScrollValue;

            if (this.cellEditor) {
                this.cellEditor.scrollValueChangedNotification();
            }

            // if (this.properties.onScrollEndLimitTrigger > 0 && this.sbVScroller.range.max - this.vScrollValue < this.properties.onScrollEndLimitTrigger) {
            //     // datadoc infinite scroll
            //     if (this.api.datasource && !this.scrollTriggered) {
            //         this.api.setDatasource(this.api.datasource);
            //     }
            //
            //     this.scrollTriggered = true;
            // } else {
            //     this.scrollTriggered = false;
            // }

            this.computeCellsBounds();
        }
    },

    /**
     * @memberOf Hypergrid#
     * @desc The data dimensions have changed, or our pixel boundaries have changed.
     * Adjust the scrollbar properties as necessary.
     */
    synchronizeScrollingBoundaries: function() {
        const numColumns = this.getColumnCount();
        const numRows = this.getRowCount();

        const bounds = this.getBounds();
        if (!bounds) {
            return;
        }

        const scrollableWidth = bounds.width - this.behavior.getFixedColumnsMaxWidth();
        for (
            var columnsWidth = 0, lastPageColumnCount = 0;
            lastPageColumnCount < numColumns && columnsWidth < scrollableWidth;
            lastPageColumnCount++
        ) {
            columnsWidth += this.getColumnWidth(numColumns - lastPageColumnCount - 1);
        }
        if (columnsWidth > scrollableWidth) {
            lastPageColumnCount--;
        }

        const scrollableHeight = this.renderer.getVisibleScrollHeight();
        for (
            var rowsHeight = 0, lastPageRowCount = 0;
            lastPageRowCount < numRows && rowsHeight < scrollableHeight;
            lastPageRowCount++
        ) {
            rowsHeight += this.getRowHeight(numRows - lastPageRowCount - 1);
        }
        if (rowsHeight > scrollableHeight) {
            lastPageRowCount--;
        }

        // inform scroll bars
        if (this.sbHScroller) {
            let hMax = Math.max(0, this.behavior.getColumnsWidth(this.behavior.getActiveColumnCount() - lastPageColumnCount + 1) - this.behavior.getFixedColumnsWidth());
            hMax += this.behavior.getColumnWidth(this.behavior.getActiveColumnCount());
            this.setHScrollbarValues(hMax);
            this.setHScrollValue(Math.min(this.hScrollValue, hMax));
        }
        if (this.sbVScroller) {
            const vMax = Math.max(0, this.behavior.getRowsHeight(this.behavior.getRowCount() - lastPageRowCount + 2) - this.behavior.getFixedRowsHeight()); // todo determine why 2
            this.setVScrollbarValues(vMax);
            this.setVScrollValue(Math.min(this.vScrollValue, vMax));
        }

        this.computeCellsBounds();

        // schedule to happen *after* the repaint
        setTimeout(this.synchronizeScrollbarsVisualization.bind(this));
    },

    /**
     * @memberOf Hypergrid#
     * @desc Scroll up one full page.
     * @returns {number}
     */
    pageUp: function() {
        const rowNum = this.renderer.getPageUpRow();
        const rowNumPixels = this.behavior.getRowsHeight(rowNum);
        this.setVScrollValue(rowNumPixels);
        return rowNumPixels;
    },

    /**
     * @memberOf Hypergrid#
     * @desc Scroll down one full page.
     * @returns {number}
     */
    pageDown: function() {
        const rowNum = this.renderer.getPageDownRow();
        const rowNumPixels = this.behavior.getRowsHeight(rowNum);
        this.setVScrollValue(rowNumPixels);
        return rowNumPixels;
    },

    /**
     * @memberOf Hypergrid#
     * @desc Scroll left one full page.
     * @returns {number}
     */
    pageLeft: function() {
        const bounds = this.getBounds();
        const currentScroll = this.behavior.getScrollPositionX();
        const scrollableWidth = bounds.width - this.behavior.getFixedColumnsMaxWidth();
        const leftPixel = currentScroll - scrollableWidth;
        this.setHScrollValue(leftPixel);
        return leftPixel;
    },

    /**
     * @memberOf Hypergrid#
     * @desc Scroll right one full page.
     * @returns {number}
     */
    pageRight: function() {
        const bounds = this.getBounds();
        const currentScroll = this.behavior.getScrollPositionX();
        const scrollableWidth = bounds.width - this.behavior.getFixedColumnsMaxWidth();
        const rightPixel = currentScroll + scrollableWidth;
        this.setHScrollValue(rightPixel);
        return rightPixel;
    }
};
