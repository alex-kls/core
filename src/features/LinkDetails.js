/* eslint-env browser */
'use strict';

var Feature = require('./Feature');

var detailsHolderElement;
var detailsShownOnDataCell = null;

var detailsHideTimeout = null;

/**
 * @constructor
 * @extends Feature
 */
var LinkDetails = Feature.extend('LinkDetails', {
    /**
     * @memberOf LinkDetails.prototype
     * @desc initial method of an feature
     * @param {Hypergrid} grid
     */
    initializeOn: function(grid) {
        if (!detailsHolderElement) {
            detailsHolderElement = this.initializeLinkDetailsDiv();
        }

        if (this.next) {
            this.next.initializeOn(grid);
        }
    },
    /**
     * @memberOf LinkDetails.prototype
     * @desc utility method to initialize div, that contains link info
     */
    initializeLinkDetailsDiv: function() {
        var holderElement = document.createElement('a');

        holderElement.style.display = 'none';
        holderElement.setAttribute('class', 'fin-link-details-div');

        document.body.appendChild(holderElement);

        return holderElement;
    },

    onApiDestroyCalled: function(grid, event) {
        this.hideLinkDetails(grid, detailsHolderElement);

        if (this.next) {
            this.next.onApiDestroyCalled(grid, event);
        }
    },

    handleCanvasOutsideMouseDown: function(grid, event) {
        this.hideLinkDetails(grid, detailsHolderElement);

        if (this.next) {
            this.next.handleCanvasOutsideMouseDown(grid, event);
        }
    },

    /**
     * @memberOf LinkDetails.prototype
     * @param {Hypergrid} grid
     * @param {CellEvent} event
     */
    handleClick: function(grid, event) {
        if (detailsShownOnDataCell
            && (detailsShownOnDataCell.x !== event.gridCell.x
                || detailsShownOnDataCell.y !== event.gridCell.y)) {
            this.hideLinkDetails(grid, detailsHolderElement);
        }

        if (this.next) {
            this.next.handleClick(grid, event);
        }
    },

    /**
     * @memberOf Feature.prototype
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @private
     * @comment Not really private but was cluttering up all the feature doc pages.
     */
    handleWheelMoved: function(grid, event) {
        this.hideLinkDetails(grid, detailsHolderElement);

        if (this.next) {
            this.next.handleWheelMoved(grid, event);
        }
    },

    handleMouseMove: function(grid, event) {
        if (!detailsShownOnDataCell
            || detailsShownOnDataCell.x !== event.gridCell.x
            || detailsShownOnDataCell.y !== event.gridCell.y) {
            if (event.properties.link || (event.properties.detectLinksPermanently && event.isValueUrl)) {
                this.hideLinkDetails(grid, detailsHolderElement);

                const linkToDisplay = event.properties.link ? event.properties.link : event.value;

                this.paintLinkDetails(detailsHolderElement,
                    grid,
                    linkToDisplay,
                    event.bounds);

                detailsShownOnDataCell = event.gridCell;
            } else if (detailsShownOnDataCell) {
                this.hideLinkDetailsTimeouted(grid, detailsHolderElement);
            }
        }

        if (this.next) {
            this.next.handleMouseMove(grid, event);
        }
    },

    /**
     * @memberOf LinkDetails.prototype
     * @desc utility method to paint context menu based on click event, and position params
     * @param {HTMLElement} linkDetailsHolderElement - Html element that contains details
     * @param {Hypergrid} grid
     * @param {array|string} linkValue - link that need to be detailed
     * @param {object} cellBounds - defines bounds of cell cell
     */
    paintLinkDetails: function(linkDetailsHolderElement, grid, linkValue, cellBounds) {
        this.hideLinkDetails(grid, linkDetailsHolderElement);

        let links = linkValue;
        if (!Array.isArray(linkValue)) {
            links = [linkValue];
        }

        links.forEach(l => {
            let outerDiv = document.createElement('div');
            let detailsLink = document.createElement('a');

            if (grid.properties.linkDetailsAnchorStyle) {
                Object.assign(detailsLink.style, grid.properties.linkDetailsAnchorStyle);
            }

            linkDetailsHolderElement.href = l;
            linkDetailsHolderElement.target = '_blank';

            detailsLink.href = l;
            let truncatedLink = this.truncateString(l, grid.properties.linkDetailsMaxStringLength, '...');
            detailsLink.text = `${truncatedLink}  `;
            detailsLink.target = '_blank';

            let detailsLinkIcon = document.createElement('i');
            detailsLinkIcon.setAttribute('class', 'fa fa-external-link');

            detailsLink.appendChild(detailsLinkIcon);

            outerDiv.appendChild(detailsLink);
            linkDetailsHolderElement.appendChild(outerDiv);
            linkDetailsHolderElement.onmouseover = function(){
                Object.assign(linkDetailsHolderElement.style, grid.properties.linkDetailsHoveredStyle);
            };
            linkDetailsHolderElement.onmouseout = function(){
                Object.assign(linkDetailsHolderElement.style, grid.properties.linkDetailsStyle);
            };
        });

        if (grid.properties.linkDetailsStyle) {
            Object.assign(linkDetailsHolderElement.style, grid.properties.linkDetailsStyle);
        }

        this.showLinkDetails(grid, linkDetailsHolderElement, cellBounds);
    },

    /**
     * @memberOf LinkDetails.prototype
     * @desc utility method to start show context menu on defined point.
     * @desc Menu must be formed before it will be passed to this method
     * @param {Hypergrid} grid
     * @param {HTMLElement} linkDetailsHolderElement - Html element that contains details
     * @param {object} cellBounds - defines bounds of cell cell
     */
    showLinkDetails: function(grid, linkDetailsHolderElement, cellBounds) {
        linkDetailsHolderElement.style.display = 'block';

        const holderComputedStyles = window.getComputedStyle(linkDetailsHolderElement);

        let startY, startX, bottomToTop = true;

        const holderHeight = holderComputedStyles.height.replace('px', '');
        if ((cellBounds.y < holderHeight) && ((Number(cellBounds.y) + Number(holderHeight)) < window.innerHeight)) {
            bottomToTop = false;
        }

        if (bottomToTop) {
            startY = cellBounds.y + grid.canvas.size.top - holderComputedStyles.height.replace('px', '');
            startX = cellBounds.x + grid.canvas.size.left + grid.properties.gridLinesVWidth;
        } else {
            startY = cellBounds.y + cellBounds.height + grid.canvas.size.top;
            startX = cellBounds.x + grid.canvas.size.left + grid.properties.gridLinesVWidth;
        }

        linkDetailsHolderElement.style.top = startY + 'px';
        linkDetailsHolderElement.style.left = startX + 'px';
    },

    /**
     * @memberOf LinkDetails.prototype
     * @desc utility method to stop displaying context menu
     * @param {Hypergrid} grid
     * @param {object} detailsHolderElement - Html element that contains link info
     */
    hideLinkDetails: function(grid, detailsHolderElement) {
        detailsHolderElement.innerHTML = '';
        detailsHolderElement.style.display = 'none';
        detailsShownOnDataCell = null;
        if (detailsHideTimeout) {
            clearTimeout(detailsHideTimeout);
            detailsHideTimeout = null;
        }
    },

    /**
     * @memberOf LinkDetails.prototype
     * @desc utility method to stop displaying context menu
     * @param {Hypergrid} grid
     * @param {object} detailsHolderElement - Html element that contains link info
     */
    hideLinkDetailsTimeouted: function(grid, detailsHolderElement) {
        if (!detailsHideTimeout) {
            detailsHideTimeout = setTimeout(() => {
                this.hideLinkDetails(grid, detailsHolderElement);
            }, grid.properties.linkDetailsHideTimeout);
        }
    },

    /**
     * @memberOf LinkDetails.prototype
     * @desc utility method to remove HTML element from current DOM
     * @param {HTMLElement} element - HTML element that need to be removed from DOM
     */
    removeDOMElement: function(element) {
        element.remove();
    },

    /**
     * @memberOf LinkDetails.prototype
     * @desc utility method to truncate string. If string greater, than value,
     * central part of string will be replaced with separator
     * @param fullStr
     * @param strLen
     * @param separator
     */
    truncateString: function(fullStr, strLen, separator) {
        if (fullStr.length <= strLen) {
            return fullStr;
        }

        separator = separator || '...';

        let sepLen = separator.length,
            charsToShow = strLen - sepLen,
            frontChars = Math.ceil(charsToShow / 2),
            backChars = Math.floor(charsToShow / 2);

        return fullStr.substr(0, frontChars) +
            separator +
            fullStr.substr(fullStr.length - backChars);
    }
});

module.exports = LinkDetails;
