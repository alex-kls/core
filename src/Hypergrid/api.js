'use strict';
/* eslint-env browser */

var equal = require('deep-equal');

// helper methods

function range(start, stop) {
    var result = [];
    for (var idx = start.charCodeAt(0), end = stop.charCodeAt(0); idx <= end; ++idx) {
        result.push(String.fromCharCode(idx));
    }
    return result;
}

function idOf(range, i) {
    return (i >= 26 ? idOf(range, (i / 26 >> 0) - 1) : '') + range[i % 26 >> 0];
}

function convertColDefs(colDefs, firstRowFont) {
    var schema = [];
    var data = { __META: { __ROW: { font: firstRowFont, foregroundSelectionFont: firstRowFont } } }; // set bold font for title row
    var az = range('A', 'Z');

    function colDefMapper(singleColDef, letters) {
        var originalField = singleColDef && singleColDef.originalField;
        var width = singleColDef && singleColDef.width;
        schema.push({
            header: letters || '',
            name: originalField || letters,
            width: width || undefined
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

function getOpenLinkFunc(link) {
    return function() {
        window.open(link, '_blank');
    };
}

// api methods

var rowModel = {
    virtualPageCache: {
        updateHeightForAllRows: function() {

        }
    },
    setExpanded: function(id, expanded) {

    }
};

var rangeController = {
    allRowsSelected: false,
    selectedCols: [],
    refreshBorders: function() {

    },
    selectAll: function() {

    }
};

var gridPanel = {
    resetVerticalScrollPosition: function() {

    }
};

var columnController = {
    getAllGridColumns: function() {
        return [];
    }
};

var floatingRowModel = {
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

var virtualPageRowModel = {
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

    var schema = convertColDefs(colDefs, this.properties.columnHeaderFontBold);
    var firstRowData = schema.data;
    var data = this.behavior.getData();

    // create first row from headers
    if (!data || data.length === 0) {
        data = [firstRowData];
        this.api.needColumnsToFit = true;
    } else if (data && !equal(data[0], firstRowData)) {
        data.splice(0, 0, firstRowData);
    }

    console.log(data);

    this.behavior.setData({
        data: data,
        schema: schema.schema
    });
    this.allowEvents(true);
    this.behavior.dataModel.setSchema(schema.schema);
}

function setRowData(rowData) {
    console.log('setRowData', rowData);

    [].push.apply(this.data, rowData);

    this.addData({ data: rowData });

    this.canvas.resize();
}

function sizeColumnsToFit() {
    console.log('sizeColumnsToFit');

    if (this.api.needColumnsToFit) {
        this.behavior.fixColumns();
        this.api.needColumnsToFit = false;
    }
}

function destroy() {
    console.log('destroy');
    this.cancelEditing();

    this.sbPrevVScrollValue = null;
    this.sbPrevHScrollValue = null;
    this.hoverCell = null;
    this.scrollingNow = false;

    this.behavior.reset();
    this.selectionModel.reset();
    this.renderer.reset();

    this.canvas.resize();
    this.behaviorChanged();
    this.refreshProperties();
    this.initialize(this.div);
}

function getRangeSelections() {
    console.log('getRangeSelections');
}

function copySelectedRangeToClipboard(includeHeaders) {
    console.log('copySelectedRangeToClipboard', includeHeaders);
}

function getSelectedColumns() {
    console.log('getSelectedColumns');
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
}

function clearFocusedCell() {
    console.log('clearFocusedCell');
    this.clearMostRecentSelection();
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

    var setRowData = this.api.setRowData;

    var startRow = this.data.length;

    if (startRow < datasource.totalSize) {
        var params = {
            startRow: startRow, // replace with correct getter
            endRow: startRow + this.paginationPageSize, // replace with correct getter
            successCallback: function(rows, lastRowIndex) {
                setRowData(rows, lastRowIndex);
            },
            failCallback: function() {
                setRowData([]);
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
    this.behavior.setCellProperty(x, y, 'link', getOpenLinkFunc(link));
}

function registerCellEditedEventListener(callback){
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

