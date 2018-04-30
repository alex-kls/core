/* eslint-env browser */

'use strict';

var DataSourceBase = require('../DatasaurBase');

/** @typedef {object} columnSchemaObject
 * @property {string} name - The required column name.
 * @property {string} [header] - An override for derived header
 * @property {function} [calculator] - A function for a computed column. Undefined for normal data columns.
 * @property {string} [type] - Used for sorting when and only when comparator not given.
 * @property {object} [comparator] - For sorting, both of following required:
 * @property {function} comparator.asc - ascending comparator
 * @property {function} comparator.desc - descending comparator
 */


/**
 * @param {object} [options]
 * @param {object[]} [options.data]
 * @param {object[]} [options.schema]
 * @constructor
 */
var DataSourceLocal = DataSourceBase.extend('DataSourceLocal', {

    initialize: function(nextDataSource, options) {
        /**
         * @summary The array of column schema objects.
         * @name schema
         * @type {columnSchemaObject[]}
         * @memberOf DataSourceLocal#
         */
        this.schema = [];

        /**
         * @summary The array of uniform data objects.
         * @name data
         * @type {object[]}
         * @memberOf DataSourceLocal#
         */
        this.data = [];
        this.cache = [];
    },

    /**
     * Establish new data and schema.
     * If no data provided, data will be set to 0 rows.
     * If no schema provided AND no previously set schema, new schema will be derived from data.
     * @param {object[]} [data=[]] - Array of uniform objects containing the grid data.
     * @param {columnSchemaObject[]} [schema=[]]
     * @memberOf DataSourceLocal#
     */
    setData: function(data, schema) {
        /**
         * @summary The array of uniform data objects.
         * @name data
         * @type {object[]}
         * @memberOf DataSourceLocal#
         */
        this.data = data || [];
        this.cache = [];

        if (schema) {
            this.setSchema(schema);
        } else if (this.data.length && !this.schema.length) {
            this.setSchema([]);
        }
    },

    /**
     * Add new data and schema.
     * If no data provided, data will be as is.
     * If no schema provided AND no previously set schema, new schema will be derived from data.
     * @param {object[]} [data=[]] - Array of uniform objects containing the grid data.
     * @param {columnSchemaObject[]} [schema=[]]
     * @memberOf DataSourceLocal#
     */
    addData: function(data, schema) {
        this.data.push.apply(this.data, data || []);
        this.cache = [];

        if (schema) {
            this.setSchema(schema);
        } else if (this.data.length && !this.schema.length) {
            this.setSchema([]);
        }
    },

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#getSchema}
     * @memberOf DataSourceLocal#
     */
    getSchema: function() {
        return this.schema;
    },
    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#setSchema}
     * @memberOf DataSourceLocal#
     */
    setSchema: function(newSchema) {
        if (!newSchema.length) {
            var dataRow = this.data.find(function(dataRow) {
                return dataRow;
            });
            if (dataRow) {
                newSchema = Object.keys(dataRow);
            }
        }

        this.schema = newSchema;
        this.dispatchEvent('data-schema-changed');
    },

    /**
     * @param y
     * @returns {dataRowObject}
     * @memberOf DataSourceLocal#
     */
    getRow: function(y) {
        return this.data[y];
    },

    /**
     * Update or blank row in place.
     *
     * _Note parameter order is the reverse of `addRow`._
     * @param {number} y
     * @param {object} [dataRow] - if omitted or otherwise falsy, row renders as blank
     * @memberOf DataSourceLocal#
     */
    setRow: function(y, dataRow) {
        this.data[y] = dataRow || undefined;
        this.cache = [];
    },

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#getRowMetadata}
     * @memberOf DataSourceLocal#
     */
    getRowMetadata: function(y, prototype) {
        var dataRow = this.data[y];
        return dataRow && (dataRow.__META || (prototype !== undefined && (dataRow.__META = Object.create(prototype))));
    },

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#setRowMetadata}
     * @memberOf DataSourceLocal#
     */
    setRowMetadata: function(y, metadata) {
        var dataRow = this.data[y];
        if (dataRow) {
            if (metadata) {
                dataRow.__META = metadata;
            } else {
                delete dataRow.__META;
            }
        }
        return !!dataRow;
    },

    /**
     * Insert or append a new row.
     *
     * _Note parameter order is the reverse of `setRow`._
     * @param {object} dataRow
     * @param {number} [y=Infinity] - The index of the new row. If `y` >= row count, row is appended to end; otherwise row is inserted at `y` and row indexes of all remaining rows are incremented.
     * @memberOf DataSourceLocal#
     */
    addRow: function(dataRow, y) {
        if (y === undefined || y >= this.getRowCount()) {
            this.data.push(dataRow);
        } else {
            this.data.splice(y, 0, dataRow);
        }
        this.cache = [];
        this.dispatchEvent('data-shape-changed');
    },

    /**
     * Insert or append a new rows.
     *
     * _Note parameter order is the reverse of `setRow`._
     * @param {array} dataRows
     * @param {number} [y=Infinity] - The index of the new row. If `y` >= row count, row is appended to end; otherwise row is inserted at `y` and row indexes of all remaining rows are incremented.
     * @memberOf DataSourceLocal#
     */
    addRows: function(dataRows, y) {
        if (y === undefined || y >= this.getRowCount()) {
            y = this.getRowCount();
        }
        this.data.splice(y, 0, dataRows);
        this.cache = [];
        this.dispatchEvent('data-shape-changed');
    },

    /**
     * Rows are removed entirely and no longer render.
     * Indexes of all remaining rows are decreased by `rowCount`.
     * @param {number} y
     * @param {number} [rowCount=1]
     * @returns {dataRowObject[]}
     * @memberOf DataSourceLocal#
     */
    delRow: function(y, rowCount) {
        var rows = this.data.splice(y, rowCount === undefined ? 1 : rowCount);
        this.cache = [];
        if (rows.length) {
            this.dispatchEvent('data-shape-changed');
        }
        return rows;
    },

    /**
     * @private
     * @param x
     * @param y
     * @private
     */
    _getDataRowObject: function(x, y) {
        if (this.cache && (x in this.cache) && (y in this.cache[x])) {
            return this.cache[x][y];
        }

        if (!(x in this.cache)) {
            this.cache[x] = [];
        }

        const row = this.data[y];

        if (!row || x > this.getColumnCount()) {
            return {};
        }

        return (this.cache[x][y] = this._getDataRowObjectByRowAndColumnIndex(row, x));
    },

    _getDataRowObjectByRowAndColumnIndex: function(row, x) {
        const columnName = this.getColumnName(x);

        if (columnName in row) {
            return { foundedValue: row[columnName] };
        }

        // get value if key consists of joined keys
        let foundedValue, skipNeeded = false;
        foundedValue = row[Object.keys(row).find((key) => {
            let combinedColumns = key.split('/');
            skipNeeded = skipNeeded || combinedColumns.includes(columnName) && combinedColumns[0] !== columnName;
            return combinedColumns[0] === columnName;
        })];

        return { foundedValue, skipNeeded };
    },

    /**
     * @summary get count value for some cell of data grid
     * @memberOf DataSourceLocal#
     */
    getCount: function(x, y) {
        let val = this._getDataRowObject(x, y).foundedValue;

        if (val !== undefined) {
            return val && val.count && val.count !== null ? val.count : undefined;
        }
    },

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#getValue}
     * @memberOf DataSourceLocal#
     */
    getValue: function(x, y) {
        let foundedDataRowValue = this._getDataRowObject(x, y).foundedValue;

        if (foundedDataRowValue !== undefined) {
            return foundedDataRowValue && foundedDataRowValue.value ? foundedDataRowValue.value : foundedDataRowValue;
        }
    },

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#setValue}
     * @memberOf DataSourceLocal#
     */
    setValue: function(x, y, value) {
        let foundedDataRowValue = this._getDataRowObject(x, y).foundedValue;

        if (foundedDataRowValue) {
            if (typeof foundedDataRowValue === 'object' && !!foundedDataRowValue.value) {
                foundedDataRowValue.value = value;
            } else {
                foundedDataRowValue = value;
            }
        }
        this.cache = [];
        this.data[y][this.getColumnName(x)] = foundedDataRowValue;
    },

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#getValue}
     * @memberOf DataSourceLocal#
     */
    getDefinedCellProperties: function(x, y) {
        let foundedDataRowValue = this._getDataRowObject(x, y).foundedValue;

        if (typeof foundedDataRowValue === 'object' && !!foundedDataRowValue.properties) {
            return foundedDataRowValue.properties;
        } else {
            return {};
        }
    },

    /**
     * @public
     * @desc get colspan of an cell, if exist. Otherwise, returns 0;
     * @param x
     * @param y
     * @return {*}
     */
    getColspan: function(x, y) {
        let dataRowObject = this._getDataRowObject(x, y);
        const foundedDataRowValue = dataRowObject.foundedValue;

        if (foundedDataRowValue && typeof foundedDataRowValue === 'object') {
            if (foundedDataRowValue.colspan) {
                return foundedDataRowValue.colspan;
            }
        } else if (dataRowObject.skipNeeded) {
            let i = x;
            while (dataRowObject.skipNeeded) {
                dataRowObject = this._getDataRowObject(--i, y);
            }
            return dataRowObject.foundedValue.colspan - (x - i);
        }

        return 0;
    },

    /**
     * @summary get additional width based on colspan
     * @param x
     * @param y
     * @returns {number}
     */
    getAdditionalWidth: function(x, y) {
        let additional = 0;
        const colspan = this.getColspan(x, y);
        for (let i = x + 1; i <= x + colspan; i++) {
            additional += this.grid.getColumnWidth(i);
        }
        return additional;
    },

    /**
     * @public
     * @desc get rowspan of an cell, if exist. Otherwise, returns 0;
     * @param x
     * @param y
     * @return {*}
     */
    getRowspan: function(x, y) {
        let foundedDataRowValue = this._getDataRowObject(x, y).foundedValue;

        if (foundedDataRowValue && typeof foundedDataRowValue === 'object' && !!foundedDataRowValue.rowspan) {
            return foundedDataRowValue.rowspan;
        } else {
            return 0;
        }
    },

    /**
     * @summary get additional height based on colspan
     * @param x
     * @param y
     * @returns {number}
     */
    getAdditionalHeight: function(x, y) {
        let additional = 0;
        const rowspan = this.getRowspan(x, y);
        for (let i = y + 1; i <= y + rowspan; i++) {
            additional += this.grid.getRowHeight(i);
        }
        return additional;
    },

    /**
     * @public
     * @param x
     * @param y
     * @return {*}
     */
    isColspanedByLeftColumn: function(x, y) {
        let rowValue = this._getDataRowObject(x, y);

        return !!rowValue.foundedValue && rowValue.foundedValue.isColspanedByColumn;
        // return this._getDataRowObject(x, y).skipNeeded;
    },

    /**
     * @public
     * @param x
     * @param y
     * @return {*}
     */
    getRowspanMainRow: function(x, y) {
        let cellOnRow = this._getDataRowObject(x, y);

        return !!cellOnRow.foundedValue && cellOnRow.foundedValue.rowspanedByRow !== undefined
            ? cellOnRow.foundedValue.rowspanedByRow
            : null;
    },

    /**
     * @public
     * @param x
     * @param y
     * @return {*}
     */
    getColspanMainColumnName: function(x, y) {
        let cellOnRow = this._getDataRowObject(x, y);

        return !!cellOnRow.foundedValue && cellOnRow.foundedValue.colspanedByColumn ? cellOnRow.foundedValue.colspanedByColumn : null;
    },

    /**
     * @public
     * @param x
     * @param y
     * @return {*}
     */
    isRowspanedByRow: function(x, y) {
        let cellOnRow = this._getDataRowObject(x, y);

        return !!cellOnRow.foundedValue && cellOnRow.foundedValue.isRowspanedByRow;
    },

    isRenderSkipNeeded: function(x, y) {
        return this.isRowspanedByRow(x, y) || this.isColspanedByLeftColumn(x, y);
    },

    /**
     * @deprecated
     * @desc Not recommended to use in any case. Especially, while render grid
     * @public
     * @param x
     * @param y
     * @return {*}
     */
    isVerticalRenderSkipNeeded: function(x, y) {
        if (y === 0) {
            return false;
        }
        for (let i = y - 1; i >= 0; i--) {
            let cellOnRow = this._getDataRowObject(x, i);
            if (!!cellOnRow
                && (cellOnRow.foundedValue && (!cellOnRow.foundedValue.rowspan || cellOnRow.foundedValue.rowspan < 1))
                || (cellOnRow.skipNeeded)) {
                return false;
            }
        }

        return true;
    },

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#getRowCount}
     * @memberOf DataSourceLocal#
     */
    getRowCount: function() {
        return this.data.length;
    },

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#getColumnCount}
     * @memberOf DataSourceLocal#
     */
    getColumnCount: function() {
        return this.schema.length;
    },

    getColumnName: function(x) {
        return (typeof x)[0] === 'n' && this.schema[x] ? this.schema[x].name : x;
    }
});

module.exports = DataSourceLocal;
