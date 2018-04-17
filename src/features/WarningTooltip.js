/* eslint-env browser */
'use strict';

const Feature = require('./Feature');

let tooltipDiv;

/**
 * @constructor
 * @extends Feature
 */
const WarningTooltip = Feature.extend('WarningTooltip', {
    isMenuShown: false,

    /**
     * @memberOf WarningTooltip.prototype
     * @desc give me an opportunity to initialize stuff on the grid
     * @param {Hypergrid} grid
     */
    initializeOn: function(grid) {
        if (!tooltipDiv) {
            tooltipDiv = this.initializeWarningTooltipDiv();
        }

        if (this.next) {
            this.next.initializeOn(grid);
        }
    },

    /**
     * @memberOf WarningTooltip.prototype
     * @desc initialize context menu div
     */
    initializeWarningTooltipDiv: function() {
        let tooltipHolderDiv = document.createElement('div');

        tooltipHolderDiv.style.display = 'none';

        document.body.appendChild(tooltipHolderDiv);

        return tooltipHolderDiv;
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
                this.paintWarningTooltip(tooltipDiv,
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
                this.paintWarningTooltip(tooltipDiv,
                    tooltipRightX,
                    tooltipTopY,
                    grid.getFieldsErrorsMessage(),
                    'right');
            }
        } else {
            this.hideWarningTooltip(tooltipDiv);
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
        this.hideWarningTooltip(tooltipDiv);

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
     * @param {HTMLElement} tooltipHolderDiv - object with Html element and related elements
     * @param {number} x - defines horizontal point of menu start
     * @param {number} y - defines vertical point of menu start
     * @param {string} text - tooltip content
     * @param {string} placement - placement of an tooltip
     */
    paintWarningTooltip: function(tooltipHolderDiv, x, y, text, placement) {
        this.hideWarningTooltip(tooltipHolderDiv);

        // tooltipHolderDiv.setAttribute('class', 'tooltip bottom fade in main-page-tooltip');

        switch (placement){
            case 'bottom':
                tooltipHolderDiv.setAttribute('class', 'tooltip bottom fade in main-page-tooltip');
                break;
            case 'right':
                tooltipHolderDiv.setAttribute('class', 'tooltip right fade in main-page-tooltip');
                break;
        }

        let tooltipArrowDiv = document.createElement('div');
        tooltipArrowDiv.setAttribute('class', 'tooltip-arrow');
        tooltipHolderDiv.appendChild(tooltipArrowDiv);

        let tooltipInnerDiv = document.createElement('div');
        tooltipInnerDiv.setAttribute('class', 'tooltip-inner');
        tooltipInnerDiv.innerHTML = text;
        tooltipHolderDiv.appendChild(tooltipInnerDiv);

        this.showWarningTooltip(tooltipHolderDiv);

        let leftX, topY;
        let tooltipWidth = tooltipHolderDiv.offsetWidth,
            tooltipHeight = tooltipHolderDiv.offsetHeight;

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

        this.moveWarningTooltip(tooltipHolderDiv, leftX, topY);
    },

    /**
     * @memberOf WarningTooltip.prototype
     * @desc utility method to start show context menu on defined point.
     * @desc Menu must be formed before it will be passed to this method
     * @param {HTMLElement} tooltipHolderDiv - Html element that represents tooltip container
     */
    showWarningTooltip: function(tooltipHolderDiv) {
        tooltipHolderDiv.style.display = 'block';
        this.isMenuShown = true;
    },

    /**
     * @memberOf WarningTooltip.prototype
     * @desc utility method to move tooltip to position
     * @desc Menu must be formed before it will be passed to this method
     * @param {HTMLElement} tooltipHolderDiv - Html element that represents tooltip container
     * @param {number} x - defines horizontal point of tooltip start
     * @param {number} y - defines vertical point of tooltip start
     */
    moveWarningTooltip: function(tooltipHolderDiv, x, y) {
        tooltipHolderDiv.style.top = y + 'px';
        tooltipHolderDiv.style.left = x + 'px';
    },

    /**
     * @memberOf WarningTooltip.prototype
     * @desc utility method to stop displaying context menu
     * @param {HTMLElement} tooltipHolderDiv - Html element that represents tooltip container
     */
    hideWarningTooltip: function(tooltipHolderDiv) {
        tooltipHolderDiv.innerHTML = '';
        tooltipHolderDiv.style.display = 'none';
        this.isMenuShown = false;
    },

    /**
     * @memberOf WarningTooltip.prototype
     * @desc utility method to remove HTML element from current DOM
     * @param {HTMLElement} element - HTML element that need to be removed from DOM
     */
    removeDOMElement: function(element) {
        element.remove();
    }
});

module.exports = WarningTooltip;
