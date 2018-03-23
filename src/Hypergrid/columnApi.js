'use strict';

function getAllGridColumns() {
}

function setColumnsVisible(keys, visible) {
    console.log(keys, visible);
}

function changePinnedRange(countToPin) {
    console.log(countToPin);
}

function getAllColumns() {

}

function resetColumnState() {

}

function getColumn(key) {
    console.log(key);

}

function moveColumn(fromIndex, toIndex) {
    console.log(fromIndex, toIndex);
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
