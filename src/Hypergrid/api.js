'use strict';
/* eslint-env browser */

const equal = require('deep-equal');

// helper methods

function range(start, stop) {
    const result = [];
    for (let idx = start.charCodeAt(0), end = stop.charCodeAt(0); idx <= end; ++idx) {
        result.push(String.fromCharCode(idx));
    }
    return result;
}

const az = range('A', 'Z');

function idOf(i) {
    return (i >= 26 ? idOf(az, (i / 26 >> 0) - 1) : '') + az[i % 26 >> 0];
}

function getFormatter(colDef) {
    const formatterMapper = (f) => {
        let formatter = f;
        if (formatter && typeof formatter !== 'string') {
            const update = formatter.prototype.update ? formatter.prototype.update : formatter;
            formatter = value => update({ colDef, value, column: colDef });
        }
        return formatter;
    };

    let dataFormatter = formatterMapper(colDef && colDef.cellRenderer);
    let headerFormatter = formatterMapper(colDef && colDef.headerCellRenderer);

    const checker = (func, ...args) => (func && typeof func === 'function') ? func(...args) : args[0];

    return (value, isHeader) => {
        if (typeof isHeader === 'object') {
            isHeader = isHeader.rowProperties ? isHeader.rowProperties.headerRow : isHeader.headerRow;
        }
        if (typeof isHeader !== 'boolean') {
            isHeader = false;
        }
        return checker(isHeader ? headerFormatter : dataFormatter, value);
    };
}

function convertColDefs(colDefs) {
    const schema = [];

    const headersFont = this.properties.columnHeaderFontBold;
    const maximumColumnWidth = this.properties.maximumColumnWidth;

    const getContextMenuItems = this.getContextMenuItems;

    const showAdditionalInfo = this.properties.showAdditionalInfo;

    const self = this;

    const data = [];

    const az = range('A', 'Z');

    let schemaColumnsCount = 0;
    let maxTreeLevel = 0;

    function countMaxTreeLevel(prevLevel, colDefsToDetect, isTopGroupCollapsed = false) {
        let currentLevel = prevLevel + 1;
        let hasVisibleColumns = false;

        colDefsToDetect.forEach((cd) => {
            const isAlwaysDisplayedColDef = cd.collapsedHeaderName || cd.isTotal;

            const isColDefVisible = !isTopGroupCollapsed || isAlwaysDisplayedColDef;
            if (isColDefVisible) {
                hasVisibleColumns = true;
                const groupCollapsed = cd.columnGroupShow !== undefined
                    && cd.columnGroupShow !== 'open'
                    && cd.columnGroupShow !== 'always-showing';

                if (cd.children && cd.children.length > 0) {
                    countMaxTreeLevel(currentLevel, cd.children, groupCollapsed);
                }
            }
        });

        if (currentLevel > maxTreeLevel && hasVisibleColumns) {
            maxTreeLevel = currentLevel;
        }
    }

    function getEmptyHeaderRow() {
        return {
            __META: {
                __ROW: {
                    headerRow: true, // used for preventing duplicates
                    font: headersFont, // set bold font for title row
                    foregroundSelectionFont: headersFont, // set bold font for title row
                    editable: true, // allow edit content
                    cellContextMenu: self.getMainMenuItems ? self.getMainMenuItems : self.properties.headerContextMenu, // set context menu items with callbacks
                    halign: 'left',
                    showCellContextMenuIcon: showAdditionalInfo,
                    showColumnType: showAdditionalInfo
                }
            }
        };
    }

    countMaxTreeLevel(0, colDefs);

    function colDefMapper(singleColDef, headerLevel = 0, topGroupCollapsed = false, topGroupsIds = []) {
        const letter = idOf(schemaColumnsCount);

        const schemaMapper = (header, name) => ({
            header,
            name,
            topGroupsIds,
            width: singleColDef.width,
            halign: singleColDef.halign,
            colTypeSign: singleColDef.colTypeSign,
            formatter: getFormatter(singleColDef) || undefined,
            format: name,
            headerPrefix: singleColDef.headerPrefix,
            cellContextMenu: getContextMenuItems,
            colDef: singleColDef
        });

        if (singleColDef) {
            if (topGroupCollapsed && !singleColDef.collapsedHeaderName && !singleColDef.isTotal) {
                return [];
            }

            if (!!singleColDef.children && singleColDef.children.length > 0) {
                let insertedColumnNames = [];
                const groupCollapsed = singleColDef.columnGroupShow
                    && singleColDef.columnGroupShow !== 'open'
                    && singleColDef.columnGroupShow !== 'always-showing';
                singleColDef.children.forEach((ch) => {
                    const newTopGroupsArray = [...topGroupsIds, singleColDef.groupId];
                    insertedColumnNames = [...insertedColumnNames, ...colDefMapper(ch, headerLevel + 1, groupCollapsed, newTopGroupsArray)];
                });

                if (insertedColumnNames.length === 0) {
                    const colDefId = singleColDef.columnName ? singleColDef.columnName : singleColDef.key;
                    if (!colDefId) {
                        return [];
                    }
                    const originalField = colDefId + '_$$cluster_size';
                    const name = originalField || letter;

                    topGroupsIds = [...topGroupsIds, singleColDef.groupId];
                    schema.push(schemaMapper(letter || '', name));
                    schemaColumnsCount++;

                    if (originalField) {
                        if (!data[headerLevel]) {
                            data[headerLevel] = getEmptyHeaderRow();
                        }
                        let rowspan = maxTreeLevel - headerLevel - 1;
                        let columnName = (topGroupCollapsed && singleColDef.collapsedHeaderName && singleColDef.collapsedHeaderName.length)
                            ? singleColDef.collapsedHeaderName
                            : singleColDef.headerName || '';
                        data[headerLevel][originalField] = {
                            rowspan: 0,
                            value: columnName,
                            count: singleColDef.count,
                            childColumnDefs: singleColDef.children,
                            groupId: singleColDef.groupId,
                            columnOpenByDefault: singleColDef.openByDefault,
                            columnGroupShow: singleColDef.columnGroupShow
                        };

                        if (rowspan > 0) {
                            rowspan--;
                            data[headerLevel + 1][originalField] = {
                                rowspan: rowspan,
                                value: 'Count',
                                count: singleColDef.count
                            };
                        }

                        if (rowspan > 0) {
                            for (let i = headerLevel + 2; i < maxTreeLevel; i++) {
                                if (!data[i]) {
                                    data[i] = getEmptyHeaderRow();
                                }
                                data[i][originalField] = {
                                    rowspan: rowspan - i,
                                    isRowspanedByRow: true,
                                    rowspanedByRow: headerLevel,
                                    count: singleColDef.count
                                };
                            }
                        }
                    }

                    return [name];
                } else {
                    if (!data[headerLevel]) {
                        data[headerLevel] = getEmptyHeaderRow();
                    }

                    const colspan = insertedColumnNames.length - 1;

                    let columnName = (topGroupCollapsed && singleColDef.collapsedHeaderName && singleColDef.collapsedHeaderName.length)
                        ? singleColDef.collapsedHeaderName
                        : singleColDef.headerName || '';

                    data[headerLevel][insertedColumnNames[0]] = {
                        colspan: colspan,
                        value: columnName,
                        properties: {
                            ignoreValuePrefix: false
                        },
                        count: singleColDef.count,
                        childColumnDefs: singleColDef.children,
                        groupId: singleColDef.groupId,
                        columnOpenByDefault: singleColDef.openByDefault,
                        columnGroupShow: singleColDef.columnGroupShow
                    };

                    for (let i = 1; i < insertedColumnNames.length; i++) {
                        data[headerLevel][insertedColumnNames[i]] = {
                            colspan: colspan - i,
                            isColspanedByColumn: true,
                            colspanedByColumn: insertedColumnNames[0],
                            count: singleColDef.count,
                            childColumnDefs: singleColDef.children,
                            groupId: singleColDef.groupId,
                            columnOpenByDefault: singleColDef.openByDefault,
                            columnGroupShow: singleColDef.columnGroupShow
                        };
                    }

                    return insertedColumnNames;
                }

            } else {
                const originalField = singleColDef.field;
                const name = originalField || letter;

                schema.push(schemaMapper(letter || '', name));
                schemaColumnsCount++;

                if (originalField) {
                    if (!data[headerLevel]) {
                        data[headerLevel] = getEmptyHeaderRow();
                    }
                    const rowspan = maxTreeLevel - headerLevel - 1;
                    let columnName = (topGroupCollapsed && singleColDef.collapsedHeaderName && singleColDef.collapsedHeaderName.length)
                        ? singleColDef.collapsedHeaderName
                        : singleColDef.headerName || '';
                    data[headerLevel][originalField] = {
                        rowspan: rowspan,
                        value: columnName,
                        count: singleColDef.count
                    };
                    for (let i = headerLevel + 1, it = 1; i < maxTreeLevel; i++, it++) {
                        if (!data[i]) {
                            data[i] = getEmptyHeaderRow();
                        }
                        data[i][originalField] = {
                            rowspan: rowspan - i,
                            isRowspanedByRow: true,
                            rowspanedByRow: headerLevel,
                            count: singleColDef.count
                        };
                    }
                }
                return [name];
            }
        } else {
            schema.push({
                header: letter || '',
                name: letter,
                maxWidth: maximumColumnWidth,
                format: name,
                cellContextMenu: getContextMenuItems
            });
            schemaColumnsCount++;
            return [letter];
        }
    }
    colDefs.forEach(singleColDef => colDefMapper(singleColDef));

    if (schemaColumnsCount < az.length) {
        for (let i = schemaColumnsCount; i < az.length; ++i) {
            colDefMapper();
        }
    }

    return { schema: schema, data: data, fictiveHeaderRowsCount: maxTreeLevel };
}

// function getOpenLinkFunc(link) {
//     return function() {
//         window.open(link, '_blank');
//     };
// }

// api methods

const rowModel = {
    virtualPageCache: {
        updateHeightForAllRows: function() {

        }
    },
    setExpanded: function(id, expanded) {

    }
};

const rangeController = {
    allRowsSelected: false,
    selectedCols: [],
    refreshBorders: function() {

    },
    selectAll: function() {

    }
};

const gridPanel = {
    resetVerticalScrollPosition: function() {
        this.log('resetVerticalScrollPosition');
        this.vScrollValue = 0;
    },
    setVerticalScrollPosition: function(value) {
        this.log('setVerticalScrollPosition');
        this.vScrollValue = value;
    },
    getVerticalScrollPosition: function() {
        this.log('getVerticalScrollPosition');
        return this.vScrollValue;
    },
    resetHorizontalScrollPosition: function() {
        this.log('resetHorizontalScrollPosition');
        this.hScrollValue = 0;
    },
    setHorizontalScrollPosition: function(value) {
        this.log('setHorizontalScrollPosition');
        this.hScrollValue = value;
    },
    getHorizontalScrollPosition: function() {
        this.log('getHorizontalScrollPosition');
        return this.hScrollValue;
    }
};

const columnController = {
    getAllGridColumns: function() {
        this.log('getAllGridColumns');
        return this.getActiveColumns();
    },
    updateDisplayedColumns: function() {
        this.log('updateDisplayedColumns');
    }
};

const floatingRowModel = {
    floatingTopRows: [],
    flattenStage: {
        execute: function(rootNode) {
            this.log(rootNode);
        }
    },
    setExpanded: function(id, expanded) {
        this.log(id, expanded);
    }
};

const virtualPageRowModel = {
    virtualPageCache: {
        updateAllRowTopFromIndexes: function() {
            this.log('updateAllRowTopFromIndexes');
        }
    },
    getRow: function(rowIndex, dontCreatePage) {
        this.log('getRow', rowIndex, dontCreatePage);
    }
};

function getVisibleColDefs(colDefs) {
    const res = colDefs.filter((cd) => !cd.isHidden);

    res.filter(cd => cd.children).forEach(cd => {
        cd.children = getVisibleColDefs(cd.children);
    });

    return res;
}

function setColumnDefs(colDefs) {
    this.log('setColumnDefs', colDefs);

    this.columnDefs = colDefs;
    this.visibleColumnDefs = getVisibleColDefs(this.columnDefs);

    const schema = convertColDefs.call(this, this.visibleColumnDefs);
    this.log('schema', schema);
    const firstRowsData = schema.data;
    let data = this.behavior.getData();

    if (this.getMainMenuItems) {
        this.behavior.grid.properties.headerContextMenu = this.getMainMenuItems;
    }

    // create first row from headers
    if (this.behavior.grid.properties.useHeaders) {
        if (!data || data.length === 0) {
            data = [...firstRowsData];
        } else {
            if (schema.fictiveHeaderRowsCount < this.behavior.grid.properties.fictiveHeaderRowsCount) {
                const diff = this.behavior.grid.properties.fictiveHeaderRowsCount - schema.fictiveHeaderRowsCount;
                data.splice(schema.fictiveHeaderRowsCount - 1, diff);
            }
            this.behavior.grid.properties.fictiveHeaderRowsCount = schema.fictiveHeaderRowsCount;
            firstRowsData.forEach((d, i) => {
                if (!equal(data[0], d)) {
                    if (this.behavior.getRowProperties(i).headerRow) {
                        data[i] = d;
                    } else {
                        data.splice(i, 0, d);
                    }
                }
            });
        }
        this.api.needColumnsToFit = true;
    }

    this.log('schema.schema', schema.schema);

    this.behavior.setData({
        data: data,
        schema: schema.schema
    });
    this.allowEvents(true);
    this.behavior.dataModel.setSchema(schema.schema);
    this.clearSelections();
}

function setRowData(rowData) {
    this.log('setRowData', rowData);

    // todo remove this in future
    if (rowData.length === 1000 && this.behavior.grid.properties.useHeaders) {
        rowData.pop();
    }

    this.data = rowData;

    this.setData({ data: rowData });
    this.behavior.buildFlatMode();

    if (this.columnDefs) {
        this.api.setColumnDefs(this.columnDefs);
    }
}

function sizeColumnsToFit() {
    this.log('sizeColumnsToFit');

    if (this.api.needColumnsToFit) {
        this.behavior.fitColumns();
        this.canvas.resize(false);
        this.addEventListener('fin-grid-rendered', function() {
            if (this.api.needColumnsToFit) {
                this.canvas.resizeNotification();
                this.api.needColumnsToFit = false;
            }
        }.bind(this));
    }
}

function destroy(total) {
    this.log('destroy', total);

    this.setHighlightText('');

    this.cancelEditing();

    this.sbPrevVScrollValue = null;
    this.sbPrevHScrollValue = null;
    this.hoverCell = null;
    this.scrollingNow = false;

    this.behavior.reset();
    this.selectionModel.reset();
    this.renderer.reset();

    this.api.rangeController.selectedCols = [];

    if (total || !this.isAlive()) {
        this.destroyScrollbars();
    } else {
        this.canvas.resize();
        this.behaviorChanged();
        this.refreshProperties();
        if (this.div) {
            this.initialize(this.div);
            this.canvas.start();
        }
    }

    this.behavior.grid.fireSyntheticApiDestroyCalled(total);
}

function getRangeSelections() {
    this.log('getRangeSelections');
    return this.getSelections();
}

function copySelectedRangeToClipboard(includeHeaders) {
    this.log('copySelectedRangeToClipboard', includeHeaders);
    this.copyIncludeHeaders = includeHeaders;
    document.execCommand('copy');
    delete this.copyIncludeHeaders;
}

function getSelectedColumns() {
    this.log('getSelectedColumns');
    return this.api.rangeController.selectedCols;
}

function getModel() {
    this.log('getModel');
    return {
        rowsToDisplay: [],
        getRow: function() {
            this.log('getRow');
        }
    };
}

function applyProperties(newProps) {
    Object.assign(this.properties, newProps);
    this.repaint();
}

function refreshView() {
    this.log('refreshView');
    this.repaint();
}

function removeItems(rowNodes) {
    this.log('removeItems', rowNodes);

}

function insertItemsAtIndex(index, items) {
    this.log('insertItemsAtIndex', index, items);
}

function clearRangeSelection() {
    this.log('clearRangeSelection');
    this.clearSelections();
    this.repaint();
}

function clearFocusedCell() {
    this.log('clearFocusedCell');
    this.clearMostRecentSelection();
    this.repaint();
}

function getFloatingTopRowData() {
    this.log('getFloatingTopRowData');
}

function getFloatingTopRowCount() {
    this.log('getFloatingTopRowCount');
}

function showNoRowsOverlay() {
    this.log('showNoRowsOverlay');
}

function hideOverlay() {
    this.log('hideOverlay');
}

function refreshCells(rowNodes, colIds, animate) {
    this.log('refreshCells', rowNodes, colIds, animate);
}

function setDatasource(datasource) {
    this.log('setDatasource', datasource);
    this.api.datasource = datasource;

    this.setHighlightText(datasource.search || '');

    const startRow = this.data.length || 0;

    if (startRow < datasource.totalSize || startRow === 0) {
        const params = {
            startRow: startRow, // replace with correct getter
            endRow: startRow + this.paginationPageSize, // replace with correct getter
            successCallback: (rows, lastRowIndex) => {
                this.log('successCallback', rows, lastRowIndex);

                // todo remove this in future
                if (startRow === 0 && rows.length === 1000) {
                    rows.pop();
                }

                [].push.apply(this.data, rows);
                this.addData({ data: rows });
                this.behavior.buildFlatMode();
            },
            failCallback: function() {
                this.log('failCallback');
                this.addData({ data: [] });
            },
            sortModel: datasource.sortModel,
            filterModel: {},
            context: undefined
        };

        datasource.getRows(params);
    }
}

function onGroupExpandedOrCollapsed(refreshFromIndex) {
    this.log('onGroupExpandedOrCollapsed', refreshFromIndex);
}

function getSortModel() {
    this.log('getSortModel');
    return [];
}

function doLayout() {
    // this.log('doLayout');
}

function refreshInMemoryRowModel() {
    this.log('refreshInMemoryRowModel');
}

function attachLinkToDataCell(x, y, link) {
    this.behavior.setCellProperty(x, y, 'link', link);
}

function registerCellEditedEventListener(callback) {
    this.addInternalEventListener('fin-after-cell-edit', callback);
}

module.exports = {
    // fields
    rowModel: rowModel,
    rangeController: rangeController,
    gridPanel: gridPanel,
    columnController: columnController,
    floatingRowModel: floatingRowModel,
    virtualPageRowModel: virtualPageRowModel,

    // functions
    setColumnDefs: setColumnDefs,
    setRowData: setRowData,
    sizeColumnsToFit: sizeColumnsToFit,
    destroy: destroy,
    getRangeSelections: getRangeSelections,
    copySelectedRangeToClipboard: copySelectedRangeToClipboard,
    getSelectedColumns: getSelectedColumns,
    getModel: getModel,
    refreshView: refreshView,
    removeItems: removeItems,
    insertItemsAtIndex: insertItemsAtIndex,
    clearRangeSelection: clearRangeSelection,
    clearFocusedCell: clearFocusedCell,
    getFloatingTopRowData: getFloatingTopRowData,
    getFloatingTopRowCount: getFloatingTopRowCount,
    showNoRowsOverlay: showNoRowsOverlay,
    hideOverlay: hideOverlay,
    refreshCells: refreshCells,
    setDatasource: setDatasource,
    onGroupExpandedOrCollapsed: onGroupExpandedOrCollapsed,
    getSortModel: getSortModel,
    doLayout: doLayout,
    refreshInMemoryRowModel: refreshInMemoryRowModel,
    attachLinkToDataCell: attachLinkToDataCell,
    registerCellEditedEventListener: registerCellEditedEventListener,
    applyProperties: applyProperties
};

