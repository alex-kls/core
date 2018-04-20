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
        menuHolderDiv.setAttribute('class', 'ag-custom');

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
    handleMouseDown: function(grid, event) {
        this.hideContextMenu(menuDiv);
        if (this.next) {
            this.next.handleMouseDown(grid, event);
        }
    },

    /**
     * @memberOf ContextMenu.prototype
     * @param {Hypergrid} grid
     * @param {CellEvent} event
     */
    handleClick: function(grid, event) {
        this.hideContextMenu(menuDiv);

        let isCursorOverContextMenuIcon = this.overContextMenuCell(grid, event);

        let contextMenuIconRightX = event.bounds.x
            + event.bounds.width
            - grid.properties.contextMenuButtonRightMargin;
        let contextMenuIconLeftX = contextMenuIconRightX
            - grid.properties.contextMenuButtonIconPreferedWidth
            - (grid.properties.contextMenuButtonPadding * 2);


        if (isCursorOverContextMenuIcon) {
            let contextMenu = grid.behavior.getCellProperties(event).cellContextMenu || grid.properties.cellContextMenu;
            if (event.isHeaderRow && grid.properties.headerContextMenu) {
                contextMenu = grid.properties.headerContextMenu;
            }

            let rightToLeft = event.primitiveEvent.detail.mouse.x + 200 >= window.innerWidth;
            let startX = rightToLeft ? contextMenuIconRightX : contextMenuIconLeftX;
            startX += grid.canvas.size.left;

            this.paintContextMenu(menuDiv,
                grid,
                event,
                contextMenu,
                startX,
                event.bounds.y + event.bounds.height + grid.canvas.size.top,
                rightToLeft);
        }

        if (this.next) {
            this.next.handleClick(grid, event);
        }
    },

    /**
     * @summary update selections if needed based on right click cell or header. if menu called on unselected item especially
     * @param {Hypergrid} grid
     * @param {CellEvent} event - the event details
     */
    updateSelections: function(grid, event) {
        if (event.isHeaderRow && !event.isColumnSelected) {
            // top row ow headers
            grid.clearSelections();
            grid.selectColumn(event.dataCell.x, event.dataCell.x);
        } else if (event.isHandleColumn && event.isDataRow && !event.isRowSelected) {
            // left row number headers
            grid.clearSelections();
            grid.selectRow(event.dataCell.y, event.dataCell.y);
        } else if (!event.isCellSelected) {
            // simple cell
            grid.clearSelections();
            grid.select(event.dataCell.x, event.dataCell.y, 0, 0);
        }
    },

    /**
     * @memberOf ContextMenu.prototype
     * @param {Hypergrid} grid
     * @param {CellEvent} event - the event details
     */
    handleContextMenu: function(grid, event) {
        let contextMenu;
        if (event.isHeaderRow && grid.properties.headerContextMenu) {
            contextMenu = grid.properties.headerContextMenu;
        } else {
            contextMenu = grid.behavior.getCellProperties(event).cellContextMenu || grid.properties.cellContextMenu;
        }

        this.updateSelections(grid, event);

        // update cell menu for left column of row numbers
        if (event.isHandleColumn && event.isDataRow) {
            const point = grid.selectionModel.getFirstSelectedCellOfLastSelection();
            if (point) {
                contextMenu = grid.behavior.getCellProperties(point.x, point.y).cellContextMenu || grid.properties.cellContextMenu;
            }
        }

        let rightToLeft = event.primitiveEvent.detail.mouse.x + 200 >= window.innerWidth;
        this.paintContextMenu(menuDiv,
            grid,
            event,
            contextMenu,
            event.primitiveEvent.detail.mouse.x + grid.canvas.size.left,
            event.primitiveEvent.detail.mouse.y + grid.canvas.size.top + 25,
            rightToLeft);
        if (this.next) {
            this.next.handleContextMenu(grid, event);
        }
    },

    handleMouseMove: function(grid, event) {
        // this.closeAllChilds(menuDiv);

        let stateChanged = false;
        let isCursorOverContextMenuIcon = this.overContextMenuCell(grid, event);
        let isPreviousCellEventExist = !!previousHoveredCellEvent;

        if (isCursorOverContextMenuIcon) {
            if (!previousHoveredCellEvent || event.bounds.x !== previousHoveredCellEvent.bounds.x
                || event.bounds.y !== previousHoveredCellEvent.bounds.y) {

                // CAUTION! If call setCellProperty method of cellEvent, renderer properties cache will not be
                // changed (so hover state of icon not be displayed before cell properties cache change)
                grid.behavior.setCellProperty(event.dataCell.x, event.dataCell.y, 'contextMenuIconIsHovered', true);
                event.contextMenuIconIsHovered = true;
                stateChanged = true;
                previousHoveredCellEvent = event;
                this.cursor = 'pointer';
            }
        } else {
            if (isPreviousCellEventExist) {

                // CAUTION! If call setCellProperty method of cellEvent, renderer properties cache will not be
                // changed (so hover state of icon not be displayed before cell properties cache change)
                grid.behavior.setCellProperty(previousHoveredCellEvent.dataCell.x, previousHoveredCellEvent.dataCell.y, 'contextMenuIconIsHovered', false);
                event.contextMenuIconIsHovered = false;
                previousHoveredCellEvent = null;
                stateChanged = true;
            }
            this.cursor = null;
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
        this.hideContextMenu(menuDiv);

        if (this.next) {
            this.next.handleDataAdded(grid, event);
        }
    },

    overContextMenuCell: function(grid, event) {
        let cellHasContextMenuItem = event.properties.showCellContextMenuIcon
            || (event.rowProperties && event.rowProperties.showCellContextMenuIcon)
            || (event.cellOwnProperties && event.cellOwnProperties.showCellContextMenuIcon);

        if (!cellHasContextMenuItem) {
            return false;
        }

        let eventCellRightX = event.bounds.width;
        let contextMenuIconRightX = eventCellRightX
            - grid.properties.contextMenuButtonRightMargin;


        let typeSignWidth = 0;
        if (event.column.schema && event.column.schema.colTypeSign) {
            let gc = grid.canvas.gc,
                prevFontState = gc.cache.font,
                prevFillStyleState = gc.cache.fillStyle,
                config = event.properties;

            gc.cache.font = config.columnTypeSignFont;
            gc.cache.fillStyle = config.columnTypeSignColor;
            typeSignWidth = gc.measureText(event.column.schema.colTypeSign).width;
            typeSignWidth += config.contextMenuLeftSpaceToCutText;

            gc.cache.font = prevFontState;
            gc.cache.fillStyle = prevFillStyleState;
        }
        let contextMenuIconLeftX = contextMenuIconRightX
            - grid.properties.contextMenuButtonIconPreferedWidth
            - (grid.properties.contextMenuButtonPadding * 2)
            - typeSignWidth;

        let contextMenuIconTopY = event.bounds.height / 2 - grid.properties.contextMenuButtonHeight / 2;
        let contextMenuIconBottomY = contextMenuIconTopY + grid.properties.contextMenuButtonHeight;

        return event.mousePoint.x <= contextMenuIconRightX
            && event.mousePoint.x >= contextMenuIconLeftX
            && event.mousePoint.y <= contextMenuIconBottomY
            && event.mousePoint.y >= contextMenuIconTopY;
    },

    /**
     * @memberOf ContextMenu.prototype
     * @desc utility method to paint context menu based on click event, and position params
     * @param {object} menuHolderDiv - object with Html element and related elements
     * @param {Hypergrid} grid
     * @param {CellEvent} event
     * @param {[]|function} items - menu items
     * @param {number} x - defines horizontal point of menu start
     * @param {number} y - defines vertical point of menu start
     * @param {boolean} rightToLeft - if true, menu will be displayed that way when it horizontally ends on X point
     */
    paintContextMenu: function(menuHolderDiv, grid, event, items, x, y, rightToLeft) {
        this.hideContextMenu(menuHolderDiv);

        var menuListHolderDiv = document.createElement('div');

        menuListHolderDiv.setAttribute('class', 'ag-menu');

        menuHolderDiv.element.appendChild(menuListHolderDiv);

        if (typeof items === 'function') {
            items = items({ column: event.column, node: { data: event.dataRow }, value: event.value });
        }

        items.forEach((item) => {
            this.makeContextMenuItem(grid, event, menuHolderDiv, menuListHolderDiv, item);
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

        const self = this;

        const menuOption = document.createElement('div');
        menuOption.style.display = 'block';

        menuOption.setAttribute('class', 'ag-menu-option');

        if (typeof item === 'object') {
            const menuOptionIconSpan = document.createElement('span');
            menuOptionIconSpan.setAttribute('class', 'ag-menu-option-icon');
            menuOptionIconSpan.setAttribute('id', 'eIcon');
            menuOption.appendChild(menuOptionIconSpan);
            if (item.icon) {
                menuOptionIconSpan.innerHTML = item.icon;
            }

            const menuOptionNameSpan = document.createElement('span');
            menuOptionNameSpan.setAttribute('class', 'ag-menu-option-text');
            menuOptionNameSpan.setAttribute('id', 'eName');
            menuOptionNameSpan.innerHTML = item.title || item.name;
            menuOption.appendChild(menuOptionNameSpan);

            const menuOptionShortcutSpan = document.createElement('span');
            menuOptionShortcutSpan.setAttribute('class', 'context-menu-option-shortcut');
            menuOptionShortcutSpan.setAttribute('id', 'eShortcut');
            menuOption.appendChild(menuOptionShortcutSpan);

            const menuOptionPopupPointerSpan = document.createElement('span');
            menuOptionPopupPointerSpan.setAttribute('class', 'context-menu-option-popup-pointer');
            menuOptionPopupPointerSpan.setAttribute('id', 'ePopupPointer');

            if (item.childMenu && item.childMenu.length) {
                menuOptionPopupPointerSpan.innerHTML = grid.properties.contextMenuChildMenuArrowIconTag;
            }

            menuOption.appendChild(menuOptionPopupPointerSpan);

            menuOption.addEventListener('click', function(clickEvent) {
                if (item.action) {
                    grid.menuClick = true;
                    item.action(clickEvent, event);
                    delete grid.menuClick;
                }
                self.hideContextMenu(menuDiv);
            });

            if (grid.properties.applyContextMenuStyling){
                if (grid.properties.contextMenuListOptionStyle) {
                    Object.assign(menuOption.style, grid.properties.contextMenuListOptionStyle);
                }

                if (grid.properties.contextMenuListOptionIconStyle){
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

            menuOption.addEventListener('mouseenter', function(event){
                self.closeAllChilds(menuHolderDiv);
                if (item.childMenu &&
                    item.childMenu.length &&
                    !item.childMenuDiv) {
                    item.childMenuDiv = self.initializeContextMenuDiv();

                    menuHolderDiv.related.push(item.childMenuDiv);

                    const rectangle = menuOption.getBoundingClientRect();
                    const rightBorderX = rectangle.right;
                    if ((rightBorderX + 200) > window.innerWidth) {
                        self.paintContextMenu(item.childMenuDiv, grid, event, item.childMenu, rectangle.left, rectangle.top, true);
                    } else {
                        self.paintContextMenu(item.childMenuDiv, grid, event, item.childMenu, rightBorderX, rectangle.top);
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

                if (item.childMenuDiv && !self.isElementContainsChild(item.childMenuDiv.element, event.relatedTarget)) {
                    self.hideContextMenu(item.childMenuDiv);
                    self.removeDOMElement(item.childMenuDiv.element);
                    item.childMenuDiv = null;
                }
            });
        } else if (item === 'separator') {
            menuOption.className = 'ag-menu-separator';

            let hrElement = document.createElement('hr');
            menuOption.appendChild(hrElement);

            if (grid.properties.applyContextMenuStyling) {
                if (grid.properties.contextMenuSeparatorStyle) {
                    Object.assign(hrElement.style, grid.properties.contextMenuSeparatorStyle);
                }
            }
        }

        menuListHolderDiv.appendChild(menuOption);
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
        this.closeAllChilds(menuHolderDiv);
    },

    closeAllChilds: function(menuHolderDiv) {
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
