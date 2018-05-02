'use strict';

function getAllGridColumns() {
    this.log('getAllGridColumns');
    return this.getActiveColumns();
}

function setColumnVisible(key, visible) {
    this.log('setColumnVisible', key, visible);

    setColumnsVisible.call(this, [key], visible);
}

function setColumnsVisible(keys, visible) {
    this.log('setColumnsVisible', keys, visible);
    let colDef = this.columnDefs;
    let columnsStateChanged = false;
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
    this.log('changePinnedRange', countToPin);
}

function getAllColumns() {
    this.log('getAllColumns');
    return this.getActiveColumns().filter(c => c.colDef);
}

function resetColumnState() {
    this.log('resetColumnState');
}

function getColumn(key) {
    this.log('getColumn', key);

}

function moveColumn(fromIndex, toIndex) {
    this.moveColumns(fromIndex, 1, toIndex, false, true);
    this.log('moveColumn', fromIndex, toIndex);
}

function getAllDisplayedVirtualColumns() {
    this.log('getAllDisplayedVirtualColumns');
    return this.getActiveColumns();
}

function autoSizeColumns(columns, force) {
    this.log('autoSizeColumns', columns, force);
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
