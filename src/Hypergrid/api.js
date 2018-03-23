'use strict';

// helper methods

var convertColDefs = function(colDefs) {
    var res = [];

    colDefs.forEach(function(cd) {
        res.push({
            header: cd.headerName || '',
            name: cd.originalField || ''
        });
    });

    return res;
};

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

var columnController = {};

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
    console.log(colDefs);

    this.columnDefs = colDefs;

    var schema = convertColDefs(colDefs);
    // this.behavior.dataModel.setSchema(schema);
    this.behavior.setData({
        data: this.behavior.getData(),
        schema: schema
    });
    this.allowEvents(true);
    this.behavior.dataModel.setSchema(schema);
}

function setRowData(rowData) {
    console.log(rowData);

    [].push.apply(this.data, rowData);

    this.addData({ data: rowData });
}

function sizeColumnsToFit() {

}

function destroy() {
    this.cancelEditing();

    this.sbPrevVScrollValue = null;
    this.sbPrevHScrollValue = null;

    this.hoverCell = null;
    this.scrollingNow = false;

    this.behavior.reset();

    this.renderer.reset();
    this.canvas.resize();
    this.behaviorChanged();

    this.refreshProperties();

    this.initialize(this.div);
}

function getRangeSelections() {

}

function copySelectedRangeToClipboard(includeHeaders) {
    console.log(includeHeaders);
}

function getSelectedColumns() {

}

function getModel() {
    return {
        rowsToDisplay: [],
        getRow: function() {

        }
    };
}

function refreshView() {

}

function removeItems(rowNodes) {
    console.log(rowNodes);

}

function insertItemsAtIndex(index, items) {
    console.log(index, items);
}

function clearRangeSelection() {

}

function clearFocusedCell() {

}

function getFloatingTopRowData() {

}

function getFloatingTopRowCount() {

}

function showNoRowsOverlay() {

}

function hideOverlay() {

}

function refreshCells(rowNodes, colIds, animate) {
    console.log(rowNodes, colIds, animate);
}

function setFloatingTopRowDataForInMemoryModel(rows) {
    console.log(rows);
}

function setDatasource(datasource) {
    console.log(datasource);

    this.api.datasource = datasource;

    var setRowData = this.api.setRowData;

    var startRow = this.data.length;

    var params = {
        startRow: startRow, // replace with correct getter
        endRow: startRow + this.paginationPageSize, // replace with correct getter
        successCallback: function(rows, lastRowIndex) {
            setRowData(rows);
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

function onGroupExpandedOrCollapsed(refreshFromIndex) {
    console.log(refreshFromIndex);
}

function getSortModel() {
    return [];
}

function doLayout() {

}

function refreshInMemoryRowModel() {

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
    refreshInMemoryRowModel: refreshInMemoryRowModel
};
