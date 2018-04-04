'use strict';

function getAllGridColumns() {
    console.log('getAllGridColumns');
}

function setColumnsVisible(keys, visible) {
    console.log('setColumnsVisible', keys, visible);
    var colDef = this.columnDefs;
    keys.forEach(function(key) {
        if (!visible) {
            var singleColDef = colDef.find(function(cd) {
                return cd.colId === key;
            });

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

module.exports = {
    // functions
    getAllGridColumns: getAllGridColumns,
    setColumnsVisible: setColumnsVisible,
    changePinnedRange: changePinnedRange,
    getAllColumns: getAllColumns,
    resetColumnState: resetColumnState,
    getColumn: getColumn,
    moveColumn: moveColumn
};
