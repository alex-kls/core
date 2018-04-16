'use strict';

function getAllGridColumns() {
    console.log('getAllGridColumns');
}

function setColumnVisible(key, visible) {
    console.log('setColumnVisible', key, visible);

    const colDef = this.columnDefs;

    if (!visible) {
        const singleColDef = this.getColDef(key);

        // remove if it isn't removed in 'onRemoveColumn' callback
        if (singleColDef) {
            colDef.splice(colDef.indexOf(singleColDef), 1);
        }
    }
    this.api.setColumnDefs(colDef);
}

function setColumnsVisible(keys, visible) {
    console.log('setColumnsVisible', keys, visible);
    var colDef = this.columnDefs;
    keys.forEach((key) => {
        if (!visible) {
            var singleColDef = this.getColDef(key);

            // remove if it isn't removed in 'onRemoveColumn' callback
            if (singleColDef) {
                colDef.splice(colDef.indexOf(singleColDef), 1);
            }
        }
    });
    this.api.setColumnDefs(colDef);
}

function changePinnedRange(countToPin) {
    console.log('changePinnedRange', countToPin);
}

function getAllColumns() {
    console.log('getAllColumns');
    return this.getActiveColumns().filter(c => c.colDef);
}

function resetColumnState() {
    console.log('resetColumnState');
}

function getColumn(key) {
    console.log('getColumn', key);

}

function moveColumn(fromIndex, toIndex) {
    console.log('moveColumn', fromIndex, toIndex);
}

function getAllDisplayedVirtualColumns() {
    console.log('getAllDisplayedVirtualColumns');
    return this.getActiveColumns();
}

function autoSizeColumns(columns, force) {
    console.log('autoSizeColumns', columns, force);
    columns.forEach(c => this.behavior.fitColumn(c, force));
}

module.exports = {
    // functions
    getAllGridColumns: getAllGridColumns,
    setColumnVisible: setColumnVisible,
    setColumnsVisible: setColumnsVisible,
    changePinnedRange: changePinnedRange,
    getAllColumns: getAllColumns,
    resetColumnState: resetColumnState,
    getColumn: getColumn,
    moveColumn: moveColumn,
    getAllDisplayedVirtualColumns: getAllDisplayedVirtualColumns,
    autoSizeColumns: autoSizeColumns
};
