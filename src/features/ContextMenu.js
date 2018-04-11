/* eslint-env browser */
'use strict';

var Feature = require('./Feature');

var menuDiv;

var previousHoveredCellEvent;

/**
 * @constructor
 * @extends Feature
 */
var ContextMenu = Feature.extend('ContextMenu', {
    /**
     * @memberOf ContextMenu.prototype
     * @desc give me an opportunity to initialize stuff on the grid
     * @param {Hypergrid} grid
     */
    initializeOn: function(grid) {
        if (!menuDiv) {
            menuDiv = this.initializeContextMenuDiv();
        }

        if (this.next) {
            this.next.initializeOn(grid);
        }
    },
    /**
     * @memberOf ContextMenu.prototype
     * @desc initialize context menu div
     */
    initializeContextMenuDiv: function() {
        var menuHolderDiv = document.createElement('div');

        menuHolderDiv.style.display = 'none';
        menuHolderDiv.style.position = 'fixed';

        document.body.appendChild(menuHolderDiv);

        return {
            element: menuHolderDiv,
            related: []
        };
    },

    /**
     * @memberOf ContextMenu.prototype
     * @param {Hypergrid} grid
     * @param {CellEvent} event
     */
    handleClick: function(grid, event) {
        this.hideContextMenu(menuDiv);

        var isCursorOverContextMenuIcon = this.overContextMenuCell(grid, event);

        if (isCursorOverContextMenuIcon) {
            console.log('234234324');
            var contextMenu = grid.behavior.getRowProperties(event).cellContextMenu || grid.properties.cellContextMenu;
            this.paintContextMenu(menuDiv,
                grid,
                event,
                contextMenu,
                event.primitiveEvent.detail.mouse.x + grid.canvas.size.left,
                event.primitiveEvent.detail.mouse.y + grid.canvas.size.top + 25);
        }

        if (this.next) {
            this.next.handleClick(grid, event);
        }
    },

    /**
     * @memberOf ContextMenu.prototype
     * @param {Hypergrid} grid
     * @param {CellEvent} event - the event details
     */
    handleContextMenu: function(grid, event) {
        var contextMenu = grid.behavior.getRowProperties(event).cellContextMenu || grid.properties.cellContextMenu;
        this.paintContextMenu(menuDiv,
            grid,
            event,
            contextMenu,
            event.primitiveEvent.detail.mouse.x + grid.canvas.size.left,
            event.primitiveEvent.detail.mouse.y + grid.canvas.size.top + 25);
        if (this.next) {
            this.next.handleContextMenu(grid, event);
        }
    },

    handleMouseMove: function(grid, event) {
        var stateChanged = false;
        var isCursorOverContextMenuIcon = this.overContextMenuCell(grid, event);
        var isPreviousCellEventExist = !!previousHoveredCellEvent;

        if (isCursorOverContextMenuIcon) {
            event.setCellProperty('contextMenuIconIsHovered', true);
            stateChanged = true;
            previousHoveredCellEvent = event;
            this.cursor = 'pointer';
        } else {
            if (isPreviousCellEventExist) {
                previousHoveredCellEvent.setCellProperty('contextMenuIconIsHovered', false);
                stateChanged = true;
            }
            this.cursor = null;
        }

        if (stateChanged) {
            grid.paintNow();
        }

        if (this.next) {
            this.next.handleMouseMove(grid, event);
        }
    },

    overContextMenuCell: function(grid, event) {
        var cellHasContextMenuItem = event.properties.showCellContextMenuIcon
            || (event.rowProperties && event.rowProperties.showCellContextMenuIcon)
            || (event.cellOwnProperties && event.cellOwnProperties.showCellContextMenuIcon);
        var eventCellRightX = event.bounds.width;
        var contextMenuIconRightX = eventCellRightX - grid.properties.cellPaddingRight - grid.properties.contextMenuIconMarginRight - 5;
        var contextMenuIconLeftX = eventCellRightX - grid.properties.cellPaddingRight;

        return cellHasContextMenuItem
            && event.mousePoint.x >= contextMenuIconRightX
            && event.mousePoint.x <= contextMenuIconLeftX
            && event.mousePoint.y <= event.bounds.height
            && event.mousePoint.y >= 0;
    },

    /**
     * @memberOf ContextMenu.prototype
     * @desc utility method to paint context menu based on click event, and position params
     * @param {object} menuHolderDiv - object with Html element and related elements
     * @param {Hypergrid} grid
     * @param {CellEvent} event
     * @param {[]} items - menu items
     * @param {number} x - defines horizontal point of menu start
     * @param {number} y - defines vertical point of menu start
     * @param {boolean} rightToLeft - if true, menu will be displayed that way when it horizontally ends on X point
     */
    paintContextMenu: function(menuHolderDiv, grid, event, items, x, y, rightToLeft) {
        this.hideContextMenu(menuHolderDiv);
        var self = this;

        var menuListHolderDiv = document.createElement('div');

        menuHolderDiv.element.appendChild(menuListHolderDiv);

        items.forEach(function(item){
            self.makeContextMenuItem(grid, event, menuHolderDiv, menuListHolderDiv, item);
        });

        if (grid.properties.applyContextMenuStyling){
            if (grid.properties.contextMenuHolderStyle) {
                Object.assign(menuHolderDiv.element.style, grid.properties.contextMenuHolderStyle);
            }
            if (grid.properties.applyContextMenuStyling) {
                Object.assign(menuListHolderDiv.style, grid.properties.contextMenuListStyle);
            }
        }

        this.showContextMenu(menuHolderDiv, x, y, rightToLeft);
    },

    /**
     * @memberOf ContextMenu.prototype
     * @desc utility method to paint single menu item and append it to list that passed as param
     * @param {Hypergrid} grid
     * @param {CellEvent} event
     * @param {object} menuHolderDiv - object with Html element and related elements
     * @param {HTMLElement} menuListHolderDiv - HTML element that represents a list of menu items
     * @param {object} item - menu item object
     */
    makeContextMenuItem: function(grid, event, menuHolderDiv, menuListHolderDiv, item) {
        if (item.hasOwnProperty('isShown')) {
            if ((typeof item.isShown === 'function') && !item.isShown(event)) {
                return;
            } else if (!item.isShown) {
                return;
            }
        }

        var self = this;

        var menuOption = document.createElement('div');
        menuOption.style.display = 'block';

        menuOption.setAttribute('class', 'ag-menu-option');

        var menuOptionIconSpan = document.createElement('span');
        menuOptionIconSpan.setAttribute('class', 'ag-menu-option-icon');
        menuOptionIconSpan.setAttribute('id', 'eIcon');
        menuOption.appendChild(menuOptionIconSpan);

        var menuOptionNameSpan = document.createElement('span');
        menuOptionNameSpan.setAttribute('class', 'ag-menu-option-text');
        menuOptionNameSpan.setAttribute('id', 'eName');
        menuOptionNameSpan.innerHTML = item.title || item.name;
        menuOption.appendChild(menuOptionNameSpan);

        var menuOptionShortcutSpan = document.createElement('span');
        menuOptionShortcutSpan.setAttribute('class', 'context-menu-option-shortcut');
        menuOptionShortcutSpan.setAttribute('id', 'eShortcut');
        menuOption.appendChild(menuOptionShortcutSpan);

        var menuOptionPopupPointerSpan = document.createElement('span');
        menuOptionPopupPointerSpan.setAttribute('class', 'context-menu-option-popup-pointer');
        menuOptionPopupPointerSpan.setAttribute('id', 'ePopupPointer');

        if (item.children && item.children.items.length) {
            menuOptionPopupPointerSpan.innerHTML = '->';
        }

        menuOption.appendChild(menuOptionPopupPointerSpan);

        menuOption.addEventListener('click', function(clickEvent) {
            if (item.action) {
                item.action(clickEvent, event);
            }
            self.hideContextMenu(menuHolderDiv);
        });

        if (grid.properties.applyContextMenuStyling){
            if (grid.properties.contextMenuListOptionStyle) {
                Object.assign(menuOption.style, grid.properties.contextMenuListOptionStyle);
            }

            if (grid.properties.contextMenuListOptionIconStyle) {
                Object.assign(menuOptionIconSpan.style, grid.properties.contextMenuListOptionIconStyle);
            }

            if (grid.properties.contextMenuListOptionTextStyle) {
                Object.assign(menuOptionNameSpan.style, grid.properties.contextMenuListOptionTextStyle);
            }

            if (grid.properties.contextMenuListOptionShortcutStyle) {
                Object.assign(menuOptionShortcutSpan.style, grid.properties.contextMenuListOptionShortcutStyle);
            }

            if (grid.properties.contextMenuListOptionPopupPointerStyle) {
                Object.assign(menuOptionPopupPointerSpan.style, grid.properties.contextMenuListOptionPopupPointerStyle);
            }
        }

        menuListHolderDiv.appendChild(menuOption);

        menuOption.addEventListener('mouseenter', function(event){
            if (item.children &&
                item.children.items &&
                item.children.items.length &&
                !item.childMenu) {
                item.childMenu = self.initializeContextMenuDiv();

                menuHolderDiv.related.push(item.childMenu);

                var rectangle = menuOption.getBoundingClientRect();
                var rightBorderX = rectangle.right;
                if ((rightBorderX + 200) > window.innerWidth) {
                    self.paintContextMenu(item.childMenu, grid, event, item.children.items, rectangle.left, rectangle.top, true);
                } else {
                    self.paintContextMenu(item.childMenu, grid, event, item.children.items, rightBorderX, rectangle.top);
                }
            }
        });

        menuOption.addEventListener('mouseover', function(event){
            if (grid.properties.applyContextMenuStyling && grid.properties.contextMenuListOptionHoverStyle){
                Object.assign(menuOption.style, grid.properties.contextMenuListOptionHoverStyle);
            }
        });

        menuOption.addEventListener('mouseleave', function(event){
            if (grid.properties.applyContextMenuStyling && grid.properties.contextMenuListOptionStyle){
                Object.assign(menuOption.style, grid.properties.contextMenuListOptionStyle);
            }

            if (item.childMenu && !self.isElementContainsChild(item.childMenu.element, event.relatedTarget)) {
                self.hideContextMenu(item.childMenu);
                self.removeDOMElement(item.childMenu.element);
                item.childMenu = null;
            }
        });
    },

    /**
     * @memberOf ContextMenu.prototype
     * @desc utility method to clear context menu HTML object and all related objects
     * @param {object} menuHolderDiv
     */
    clearContextMenu: function(menuHolderDiv) {
        while (menuHolderDiv.element.firstChild) {
            menuHolderDiv.element.removeChild(menuHolderDiv.element.firstChild);
        }
        while (menuHolderDiv.related.length) {
            this.hideContextMenu(menuHolderDiv.related[0]);
            menuHolderDiv.related.shift();
        }
    },

    /**
     * @memberOf ContextMenu.prototype
     * @desc utility method to start show context menu on defined point.
     * @desc Menu must be formed before it will be passed to this method
     * @param {object} menuHolderDiv - object with Html element and related elements
     * @param {number} x - defines horizontal point of menu start
     * @param {number} y - defines vertical point of menu start
     * @param {boolean} rightToLeft - if true, menu will be displayed that way when it horizontally ends on X point
     */
    showContextMenu: function(menuHolderDiv, x, y, rightToLeft) {
        menuHolderDiv.element.style.display = 'block';
        menuHolderDiv.element.style.top = y + 'px';

        var startX = x;
        if (rightToLeft) {
            startX = x - menuHolderDiv.element.offsetWidth;
        }
        menuHolderDiv.element.style.left = startX + 'px';
    },

    /**
     * @memberOf ContextMenu.prototype
     * @desc utility method to stop displaying context menu
     * @param {object} menuHolderDiv - object with Html element and related elements
     */
    hideContextMenu: function(menuHolderDiv) {
        this.clearContextMenu(menuHolderDiv);
        menuHolderDiv.element.style.display = 'none';
    },

    /**
     * @memberOf ContextMenu.prototype
     * @desc utility method to remove HTML element from current DOM
     * @param {HTMLElement} element - HTML element that need to be removed from DOM
     */
    removeDOMElement: function(element) {
        element.remove();
    },

    /**
     * @memberOf ContextMenu.prototype
     * @desc utility method to check is one HTML element contains another in any level
     * @param {HTMLElement} element - HTML element that need to be checked
     * @param {HTMLElement} concreteChild - HTML element that need to be found inside
     */
    isElementContainsChild: function(element, concreteChild) {
        if (element === concreteChild) {
            return true;
        }

        for (var child = element.firstChild; child; child = child.nextSibling) {
            if (child === concreteChild) {
                return true;
            }

            var isChildContainsElement = this.isElementContainsChild(child, concreteChild);
            if (isChildContainsElement) {
                return true;
            }
        }

        return false;
    }
});

module.exports = ContextMenu;
