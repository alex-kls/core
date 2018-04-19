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

function idOf(range, i) {
    return (i >= 26 ? idOf(range, (i / 26 >> 0) - 1) : '') + range[i % 26 >> 0];
}

function getFormatter(colDef) {
    const formatterMapper = (f) => {
        let formatter = f;
        if (formatter && typeof formatter !== 'string') {
            const update = formatter.prototype.update ? formatter.prototype.update : formatter;
            formatter = (value, row) => update({ colDef, value, data: row, column: colDef });
        }
        return formatter;
    };

    let dataFormatter = formatterMapper(colDef && colDef.cellRenderer);
    let headerFormatter = formatterMapper(colDef && colDef.headerCellRenderer);

    const checker = (func, ...args) => {
        return (func && typeof func === 'function') ? func(...args) : args[0];
    };

    return (value, row) => {
        if (row && row.__META && row.__META.__ROW && row.__META.__ROW.headerRow) {
            return checker(headerFormatter, value, row);
        }
        return checker(dataFormatter, value, row);
    };
}

function convertColDefs(colDefs) {
    const schema = [];

    const headersFont = this.properties.columnHeaderFontBold;
    const maximumColumnWidth = this.properties.maximumColumnWidth;

    const getContextMenuItems = this.getContextMenuItems;

    const showAdditionalInfo = this.properties.showAdditionalInfo;

    const data = {
        __META: {
            __ROW: {
                headerRow: true, // used for preventing duplicates
                font: headersFont, // set bold font for title row
                foregroundSelectionFont: headersFont, // set bold font for title row
                editable: true, // allow edit content
                cellContextMenu: this.getMainMenuItems ? this.getMainMenuItems : this.properties.headerContextMenu, // set context menu items with callbacks
                halign: 'left',
                showCellContextMenuIcon: showAdditionalInfo,
                showColumnType: showAdditionalInfo
            }
        }
    };
    const az = range('A', 'Z');

    function colDefMapper(singleColDef, letters) {
        const originalField = singleColDef && (singleColDef.originalField || singleColDef.field);
        const width = singleColDef && singleColDef.width;
        const halign = singleColDef && singleColDef.halign;
        const colTypeSign = singleColDef && singleColDef.colTypeSign;
        const maxWidth = singleColDef && singleColDef.maxWidth;
        const headerPrefix = singleColDef && singleColDef.headerPrefix;
        const name = originalField || letters;

        schema.push({
            header: letters || '',
            name: name,
            width: width || undefined,
            halign: halign || undefined,
            colTypeSign: colTypeSign || undefined,
            maxWidth: maxWidth && maxWidth < maximumColumnWidth ? maxWidth : maximumColumnWidth,
            formatter: getFormatter(singleColDef) || undefined,
            format: name,
            headerPrefix: headerPrefix || undefined,
            cellContextMenu: getContextMenuItems,
            colDef: singleColDef
        });

        if (originalField) {
            data[originalField] = singleColDef.headerName || '';
        }
    }

    if (colDefs.length < az.length) {
        az.forEach(function(singleLetter, index) {
            colDefMapper(colDefs[index], singleLetter);
        });
    } else {
        colDefs.forEach(function(singleColDef, index) {
            colDefMapper(singleColDef, idOf(az, index));
        });
    }

    return { schema: schema, data: data };
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
        console.log('resetVerticalScrollPosition');
        this.vScrollValue = 0;
    },
    setVerticalScrollPosition: function(value) {
        console.log('setVerticalScrollPosition');
        this.vScrollValue = value;
    },
    getVerticalScrollPosition: function() {
        console.log('getVerticalScrollPosition');
        return this.vScrollValue;
    },
    resetHorizontalScrollPosition: function() {
        console.log('resetHorizontalScrollPosition');
        this.hScrollValue = 0;
    },
    setHorizontalScrollPosition: function(value) {
        console.log('setHorizontalScrollPosition');
        this.hScrollValue = value;
    },
    getHorizontalScrollPosition: function() {
        console.log('getHorizontalScrollPosition');
        return this.hScrollValue;
    }
};

const columnController = {
    getAllGridColumns: function() {
        console.log('getAllGridColumns');
        return [];
    },
    updateDisplayedColumns: function() {
        console.log('updateDisplayedColumns');
    }
};

const floatingRowModel = {
    floatingTopRows: [],
    flattenStage: {
        execute: function(rootNode) {
            console.log(rootNode);
        }
    },
    setExpanded: function(id, expanded) {
        console.log(id, expanded);
    }
};

const virtualPageRowModel = {
    virtualPageCache: {
        updateAllRowTopFromIndexes: function() {

        }
    },
    getRow: function(rowIndex, dontCreatePage) {
        console.log(rowIndex, dontCreatePage);
    }
};

function setColumnDefs(colDefs) {
    console.log('setColumnDefs', colDefs);
    this.columnDefs = colDefs;

    const schema = convertColDefs.bind(this)(colDefs);
    const firstRowData = schema.data;
    let data = this.behavior.getData();


    if (this.getMainMenuItems) {
        this.behavior.grid.properties.headerContextMenu = this.getMainMenuItems;
    }

    // create first row from headers
    if (!data || data.length === 0) {
        data = [firstRowData];
        this.api.needColumnsToFit = true;
    } else if (data && !equal(data[0], firstRowData)) {
        if (this.behavior.getRowProperties(0).headerRow) {
            data[0] = firstRowData;
        } else {
            data.splice(0, 0, firstRowData);
        }
    }

    this.behavior.setData({
        data: data,
        schema: schema.schema
    });
    this.allowEvents(true);
    this.behavior.dataModel.setSchema(schema.schema);
    this.clearSelections();
}

function setRowData(rowData) {
    console.log('setRowData', rowData);

    // todo remove this in future
    if (rowData.length === 1000) {
        rowData.pop();
    }

    this.data = rowData;

    this.setData({ data: rowData });
}

function sizeColumnsToFit() {
    console.log('sizeColumnsToFit');

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
    console.log('destroy', total);

    this.cancelEditing();

    this.sbPrevVScrollValue = null;
    this.sbPrevHScrollValue = null;
    this.hoverCell = null;
    this.scrollingNow = false;

    this.behavior.reset();
    this.selectionModel.reset();
    this.renderer.reset();

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
}

function getRangeSelections() {
    console.log('getRangeSelections');
    return this.getSelections().map(s => ({ start: { rowIndex: s.left, column: s.top }, end: { rowIndex: s.right, column: s.bottom } }));
}

function copySelectedRangeToClipboard(includeHeaders) {
    console.log('copySelectedRangeToClipboard', includeHeaders);
    this.copyIncludeHeaders = includeHeaders;
    document.execCommand('copy');
    delete this.copyIncludeHeaders;
}

function getSelectedColumns() {
    console.log('getSelectedColumns');
    return this.api.rangeController.selectedCols;
}

function getModel() {
    console.log('getModel');
    return {
        rowsToDisplay: [],
        getRow: function() {
            console.log('getRow');
        }
    };
}

function refreshView() {
    console.log('refreshView');
    this.repaint();
}

function removeItems(rowNodes) {
    console.log('removeItems', rowNodes);

}

function insertItemsAtIndex(index, items) {
    console.log('insertItemsAtIndex', index, items);
}

function clearRangeSelection() {
    console.log('clearRangeSelection');
    this.clearSelections();
    this.repaint();
}

function clearFocusedCell() {
    console.log('clearFocusedCell');
    this.clearMostRecentSelection();
    this.repaint();
}

function getFloatingTopRowData() {
    console.log('getFloatingTopRowData');
}

function getFloatingTopRowCount() {
    console.log('getFloatingTopRowCount');
}

function showNoRowsOverlay() {
    console.log('showNoRowsOverlay');
}

function hideOverlay() {
    console.log('hideOverlay');
}

function refreshCells(rowNodes, colIds, animate) {
    console.log('refreshCells', rowNodes, colIds, animate);
}

function setFloatingTopRowDataForInMemoryModel(rows) {
    console.log('setFloatingTopRowDataForInMemoryModel', rows);
}

function setDatasource(datasource) {
    console.log('setDatasource', datasource);
    this.api.datasource = datasource;

    const startRow = this.data.length || 0;

    if (startRow < datasource.totalSize) {
        const params = {
            startRow: startRow, // replace with correct getter
            endRow: startRow + this.paginationPageSize, // replace with correct getter
            successCallback: (rows, lastRowIndex) => {
                console.log('successCallback', rows, lastRowIndex);

                // todo remove this in future
                if (startRow === 0 && rows.length === 1000) {
                    rows.pop();
                }

                [].push.apply(this.data, rows);
                this.addData({ data: rows });
            },
            failCallback: function() {
                console.log('failCallback');
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
    console.log('onGroupExpandedOrCollapsed', refreshFromIndex);
}

function getSortModel() {
    console.log('getSortModel');
    return [];
}

function doLayout() {
    console.log('doLayout');
}

function refreshInMemoryRowModel() {
    console.log('refreshInMemoryRowModel');
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
    setFloatingTopRowDataForInMemoryModel: setFloatingTopRowDataForInMemoryModel,
    setDatasource: setDatasource,
    onGroupExpandedOrCollapsed: onGroupExpandedOrCollapsed,
    getSortModel: getSortModel,
    doLayout: doLayout,
    refreshInMemoryRowModel: refreshInMemoryRowModel,
    attachLinkToDataCell: attachLinkToDataCell,
    registerCellEditedEventListener: registerCellEditedEventListener
};

