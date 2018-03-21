'use strict';

function convertColDefs(colDefs) {
    var res = [];

    colDefs.forEach(function(cd) {
        res.push({
            header: cd.headerName || '',
            name: cd.originalField
        });
    });

    return res;
}

function setColumnDefs(colDefs) {
    if (this.setData) {
        var data = this.behavior.getData();

        var schema = convertColDefs(colDefs);

        this.setData(data, {
            data: data,
            schema: schema
        });
    }
}

module.exports.mixin = {
    setColumnDefs: setColumnDefs
};
