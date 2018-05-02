/* eslint-env browser */
'use strict';

var Feature = require('./Feature');

var detailsHolderDiv;

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
        if (!detailsHolderDiv) {
            detailsHolderDiv = this.initializeLinkDetailsDiv();
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
        var holderDiv = document.createElement('div');

        holderDiv.style.display = 'none';
        holderDiv.style.position = 'absolute';
        holderDiv.setAttribute('class', 'fin-link-details-div');

        document.body.appendChild(holderDiv);

        return holderDiv;
    },

    /**
     * @memberOf LinkDetails.prototype
     * @param {Hypergrid} grid
     * @param {CellEvent} event
     */
    handleClick: function(grid, event) {
        this.hideLinkDetails(detailsHolderDiv);

        if (event.properties.link || (event.properties.detectLinksPermanently && event.isValueUrl)) {
            const linkToDisplay = event.properties.link ? event.properties.link : event.value;

            this.paintLinkDetails(detailsHolderDiv,
                grid,
                linkToDisplay,
                event.bounds);
            if (this.next) {
                this.next.handleClick(grid, event);
            }
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
        this.hideLinkDetails(detailsHolderDiv);

        if (this.next) {
            this.next.handleWheelMoved(grid, event);
        }
    },

    handleMouseMove: function(grid, event) {
        let link = event.properties.link,
            isActionableLink = (link && typeof link !== 'boolean') || (event.properties.detectLinksPermanently && event.isValueUrl); // actionable with truthy other than `true`
        this.cursor = isActionableLink ? 'pointer' : null;

        if (this.next) {
            this.next.handleMouseMove(grid, event);
        }
    },

    /**
     * @memberOf LinkDetails.prototype
     * @desc utility method to paint context menu based on click event, and position params
     * @param {HTMLElement} linkDetailsHolderDiv - Html element that contains details
     * @param {Hypergrid} grid
     * @param {array|string} linkValue - link that need to be detailed
     * @param {object} cellBounds - defines bounds of cell cell
     */
    paintLinkDetails: function(linkDetailsHolderDiv, grid, linkValue, cellBounds) {
        this.hideLinkDetails(linkDetailsHolderDiv);

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


            detailsLink.href = l;
            detailsLink.text = l;
            detailsLink.target = '_blank';

            let detailsLinkIcon = document.createElement('i');
            detailsLinkIcon.setAttribute('class', 'fa fa-external-link');

            detailsLink.appendChild(detailsLinkIcon);

            outerDiv.appendChild(detailsLink);
            linkDetailsHolderDiv.appendChild(outerDiv);
        });

        if (grid.properties.linkDetailsStyle) {
            Object.assign(linkDetailsHolderDiv.style, grid.properties.linkDetailsStyle);
        }

        this.showLinkDetails(grid, linkDetailsHolderDiv, cellBounds);
    },

    /**
     * @memberOf LinkDetails.prototype
     * @desc utility method to start show context menu on defined point.
     * @desc Menu must be formed before it will be passed to this method
     * @param {Hypergrid} grid
     * @param {HTMLElement} linkDetailsHolderDiv - Html element that contains details
     * @param {object} cellBounds - defines bounds of cell cell
     */
    showLinkDetails: function(grid, linkDetailsHolderDiv, cellBounds) {
        linkDetailsHolderDiv.style.display = 'block';

        const holderComputedStyles = window.getComputedStyle(linkDetailsHolderDiv);

        let startY, startX, bottomToTop = true;

        const holderHeight = holderComputedStyles.height.replace('px', '');
        if ((cellBounds.y < holderHeight) && ((Number(cellBounds.y) + Number(holderHeight)) < window.innerHeight)) {
            bottomToTop = false;
        }

        if (bottomToTop) {
            startY = cellBounds.y + grid.canvas.size.top - holderComputedStyles.height.replace('px', '');
            startX = cellBounds.x + grid.canvas.size.left;
        } else {
            startY = cellBounds.y + cellBounds.height + grid.canvas.size.top;
            startX = cellBounds.x + grid.canvas.size.left;
        }

        linkDetailsHolderDiv.style.top = startY + 'px';
        linkDetailsHolderDiv.style.left = startX + 'px';
    },

    /**
     * @memberOf LinkDetails.prototype
     * @desc utility method to stop displaying context menu
     * @param {object} detailsHolderDiv - Html element that contains link info
     */
    hideLinkDetails: function(detailsHolderDiv) {
        detailsHolderDiv.innerHTML = '';
        detailsHolderDiv.style.display = 'none';
    },

    /**
     * @memberOf LinkDetails.prototype
     * @desc utility method to remove HTML element from current DOM
     * @param {HTMLElement} element - HTML element that need to be removed from DOM
     */
    removeDOMElement: function(element) {
        element.remove();
    }
});

module.exports = LinkDetails;
