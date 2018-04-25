'use strict';

function getAllGridColumns() {
    console.log('getAllGridColumns');
    return this.getActiveColumns();
}

function setColumnVisible(key, visible) {
    console.log('setColumnVisible', key, visible);

    setColumnsVisible.bind(this)([key], visible);
}

function setColumnsVisible(keys, visible) {
    console.log('setColumnsVisible', keys, visible);
    let colDef = this.columnDefs,
        columnsStateChanged = false;
    keys.forEach((key) => {
        let singleColDef = this.getColDef(key);
        if (singleColDef) {
            singleColDef.isHidden = !visible;
            columnsStateChanged = true;
        }
    });

    if (columnsStateChanged) {
        this.api.setColumnDefs(colDef);
        this.api.needColumnsToFit = true;
    }
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
    this.moveColumns(fromIndex, 1, toIndex, false, true);
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
