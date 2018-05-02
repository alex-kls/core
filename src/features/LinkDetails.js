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
        holderDiv.style.position = 'fixed';
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
                event.bounds.x,
                event.bounds.y);
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
     * @param {string} link - link that need to be detailed
     * @param {number} x - defines horizontal point of menu start
     * @param {number} y - defines vertical point of menu start
     */
    paintLinkDetails: function(linkDetailsHolderDiv, grid, linkValue, x, y) {
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

        this.showLinkDetails(grid, linkDetailsHolderDiv, x, y);
    },

    /**
     * @memberOf LinkDetails.prototype
     * @desc utility method to start show context menu on defined point.
     * @desc Menu must be formed before it will be passed to this method
     * @param {Hypergrid} grid
     * @param {HTMLElement} linkDetailsHolderDiv - Html element that contains details
     * @param {number} x - defines horizontal point of menu start
     * @param {number} y - defines vertical point of menu start
     * @param {boolean} rightToLeft - if true, menu will be displayed that way when it horizontally ends on X point
     */
    showLinkDetails: function(grid, linkDetailsHolderDiv, x, y) {
        linkDetailsHolderDiv.style.display = 'block';

        var holderComputedStyles = window.getComputedStyle(linkDetailsHolderDiv);

        var startY = y + grid.canvas.size.top - holderComputedStyles.height.replace('px', '');
        var startX = x + grid.canvas.size.left;
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
