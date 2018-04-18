/* eslint-env browser */
'use strict';

const Feature = require('./Feature');

var tooltipDiv,
    fadeInInterval,
    fadeOutInterval;

/**
 * @constructor
 * @extends Feature
 */
const WarningTooltip = Feature.extend('WarningTooltip', {
    isMenuShown: false,

    /**
     * @memberOf WarningTooltip.prototype
     * @desc initialize context menu div
     */
    initializeWarningTooltipDiv: function() {
        tooltipDiv = document.createElement('div');

        tooltipDiv.style.display = 'none';

        document.body.appendChild(tooltipDiv);

        return tooltipDiv;
    },

    handleMouseMove: function(grid, event) {
        let stateChanged = false;
        let isCursorOverCollumnWarningIcon = this.overColumnWarningIcon(grid, event);
        let isCursorOverTotalWarningIcon = this.overTotalWarningIcon(grid, event);

        if (isCursorOverCollumnWarningIcon) {
            if (!this.isMenuShown) {
                let tooltipRightX = event.bounds.x
                    + event.properties.cellPaddingLeft
                    + grid.canvas.size.left
                    + 8;
                let tooltipTopY = event.bounds.y + event.bounds.height + grid.canvas.size.top;
                this.paintWarningTooltip(grid,
                    tooltipRightX,
                    tooltipTopY,
                    event.column.firstError.description,
                    'bottom');
            }
        } else if (isCursorOverTotalWarningIcon) {
            if (!this.isMenuShown) {
                let tooltipRightX = event.bounds.x
                    + event.bounds.width / 2 + event.properties.totalErrorsCountIconWidth / 2
                    + grid.canvas.size.left;
                let tooltipTopY = event.bounds.y + event.bounds.height / 2 + grid.canvas.size.top;
                this.paintWarningTooltip(grid,
                    tooltipRightX,
                    tooltipTopY,
                    grid.getFieldsErrorsMessage(),
                    'right');
            }
        } else {
            if (this.isMenuShown) {
                this.hideWarningTooltip(tooltipDiv);
            }
        }

        if (stateChanged) {
            grid.repaint();
        }

        if (this.next) {
            this.next.handleMouseMove(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @desc handle grid data added event
     * @param {Hypergrid} grid
     * @param {object} event
     * @private
     * @comment Not really private but was cluttering up all the feature doc pages.
     */
    handleDataAdded: function(grid, event) {
        this.hideWarningTooltip();

        if (this.next) {
            this.next.handleDataAdded(grid, event);
        }
    },

    overColumnWarningIcon: function(grid, event) {
        let columnHasError = event.column.hasError;
        let isHeaderRow = event.properties.headerRow || event.rowProperties.headerRow;

        if (!columnHasError || !isHeaderRow) {
            return false;
        }

        let warningIconLeftX = event.properties.cellPaddingLeft;
        let warningIconRightX = warningIconLeftX + 14 + event.properties.columnTitlePrefixRightSpace;

        let warningIconTopY = 5;
        let warningIconBottomY = event.bounds.height - 5;

        return event.mousePoint.x <= warningIconRightX
            && event.mousePoint.x >= warningIconLeftX
            && event.mousePoint.y <= warningIconBottomY
            && event.mousePoint.y >= warningIconTopY;
    },

    overTotalWarningIcon: function(grid, event) {
        let x = event.gridCell.x;
        let r = event.dataCell.y;

        let renderTotalErrorSignNeeded = x === grid.behavior.rowColumnIndex
            && r === 0
            && event.isHeaderRow
            && grid.behavior.errorCount;

        if (!renderTotalErrorSignNeeded) {
            return false;
        }

        let totalErrorsCountIconStartY = event.bounds.height / 2 - event.properties.totalErrorsCountIconHeight / 2;
        let totalErrorsCountIconEndY = totalErrorsCountIconStartY + event.properties.totalErrorsCountIconHeight;
        let totalErrorsCountIconStartX = event.bounds.width / 2 - event.properties.totalErrorsCountIconWidth / 2;
        let totalErrorsCountIconEndX = totalErrorsCountIconStartX + event.properties.totalErrorsCountIconWidth;


        return event.mousePoint.x <= totalErrorsCountIconEndX
            && event.mousePoint.x >= totalErrorsCountIconStartX
            && event.mousePoint.y <= totalErrorsCountIconEndY
            && event.mousePoint.y >= totalErrorsCountIconStartY;
    },

    /**
     * @memberOf WarningTooltip.prototype
     * @desc utility method to paint context menu based on click event, and position params
     * @param {Hypergrid} grid
     * @param {number} x - defines horizontal point of menu start
     * @param {number} y - defines vertical point of menu start
     * @param {string} text - tooltip content
     * @param {string} placement - placement of an tooltip
     */
    paintWarningTooltip: function(grid, x, y, text, placement) {
        this.hideWarningTooltip(tooltipDiv);

        if (!tooltipDiv) {
            this.initializeWarningTooltipDiv();
        }

        // tooltipHolderDiv.setAttribute('class', 'tooltip bottom fade in main-page-tooltip');

        switch (placement){
            case 'bottom':
                tooltipDiv.setAttribute('class', grid.properties.warningTooltipBottomClass);
                break;
            case 'right':
                tooltipDiv.setAttribute('class', grid.properties.warningTooltipRightClass);
                break;
        }

        let tooltipArrowDiv = document.createElement('div');
        tooltipArrowDiv.setAttribute('class', grid.properties.warningTooltipArrowClass);
        tooltipDiv.appendChild(tooltipArrowDiv);

        let tooltipInnerDiv = document.createElement('div');
        tooltipInnerDiv.setAttribute('class', grid.properties.warningTooltipInnerClass);
        tooltipInnerDiv.innerHTML = text;
        tooltipDiv.appendChild(tooltipInnerDiv);

        this.showWarningTooltip();

        let leftX, topY;
        let tooltipWidth = tooltipDiv.offsetWidth,
            tooltipHeight = tooltipDiv.offsetHeight;

        switch (placement){
            case 'bottom':
                leftX = x - tooltipWidth / 2;
                topY = y;
                break;
            case 'right':
                leftX = x;
                topY = y - tooltipHeight / 2;
                break;
        }

        this.moveWarningTooltip(leftX, topY);
    },

    /**
     * @memberOf WarningTooltip.prototype
     * @desc utility method to start show context menu on defined point.
     * @desc Menu must be formed before it will be passed to this method
     */
    showWarningTooltip: function() {
        let op = 0.1;  // initial opacity
        tooltipDiv.style.opacity = op;
        tooltipDiv.style.display = 'block';
        this.isMenuShown = true;
        this.clearIntervals();
        fadeInInterval = setInterval(() => {
            if (op >= 1){
                clearInterval(fadeInInterval);
            }
            if (!tooltipDiv) {
                return;
            }
            tooltipDiv.style.opacity = op;
            tooltipDiv.style.filter = 'alpha(opacity=' + op * 100 + ')';
            op += op * 0.2;
        }, 5);
    },

    /**
     * @memberOf WarningTooltip.prototype
     * @desc utility method to move tooltip to position
     * @desc Menu must be formed before it will be passed to this method
     * @param {number} x - defines horizontal point of tooltip start
     * @param {number} y - defines vertical point of tooltip start
     */
    moveWarningTooltip: function(x, y) {
        tooltipDiv.style.top = y + 'px';
        tooltipDiv.style.left = x + 'px';
    },

    /**
     * @memberOf WarningTooltip.prototype
     * @desc utility method to stop displaying context menu
     */
    hideWarningTooltip: function() {
        this.isMenuShown = false;

        if (!tooltipDiv) {
            return;
        }

        let op = 1;  // initial opacity
        this.clearIntervals();
        fadeOutInterval = setInterval(() => {
            if (op <= 0.1){
                clearInterval(fadeOutInterval);

                if (!tooltipDiv) {
                    return;
                }
                tooltipDiv.style.display = 'none';

                tooltipDiv.innerHTML = '';
                tooltipDiv.remove();
                tooltipDiv = null;
            }

            if (!tooltipDiv) {
                return;
            }

            tooltipDiv.style.opacity = op;
            tooltipDiv.style.filter = 'alpha(opacity=' + op * 100 + ')';
            op -= op * 0.2;
        }, 5);
    },

    clearIntervals: function() {
        if  (fadeOutInterval) {
            clearInterval(fadeOutInterval);
        }
        if  (fadeInInterval) {
            clearInterval(fadeInInterval);
        }
    }
});

module.exports = WarningTooltip;
