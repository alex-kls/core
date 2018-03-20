'use strict';

var Behavior = require('./Behavior');

/** @name DataSource
 * @memberOf Behavior#
 * @default require('datasaur-local')
 * @summary Default data source.
 * @desc If defined, will be used as a default data source for newly instantiated `Hypergrid` objects without `DataSource` or `dataSource` options specified. Scheduled for removal in next version (v4).
 */
var DefaultDataModel = require('datasaur-local');

var decorators = require('./dataModel/decorators');


/**
 * This class mimics the {@link dataModelAPI}.
 * > This constructor (actually {@link Local#initialize}) will be called upon instantiation of this class or of any class that extends from this class. See {@link https://github.com/joneit/extend-me|extend-me} for more info.
 * @constructor
 * @extends Behavior
 */
var Local = Behavior.extend('Local', {

    initialize: function(grid, options) {
        this.setData(options);
    },

    createColumns: function() {
        Behavior.prototype.createColumns.call(this);

        this.schema.forEach(function(columnSchema, index) {
            this.addColumn({
                index: index,
                header: columnSchema.header,
                calculator: columnSchema.calculator
            });
        }, this);
    },

    /**
     * @memberOf Local#
     * @description Set the header labels.
     * @param {string[]|object} headers - The header labels. One of:
     * * _If an array:_ Must contain all headers in column order.
     * * _If a hash:_ May contain any headers, keyed by field name, in any order.
     */
    setHeaders: function(headers) {
        if (headers instanceof Array) {
            // Reset all headers
            var allColumns = this.allColumns;
            headers.forEach(function(header, index) {
                allColumns[index].header = header; // setter updates header in both column and data source objects
            });
        } else if (typeof headers === 'object') {
            // Adjust just the headers in the hash
            this.allColumns.forEach(function(column) {
                if (headers[column.name]) {
                    column.header = headers[column.name];
                }
            });
        }
    },

    /**
     * @memberOf Local#
     * @summary Set grid data.
     * @desc Exits without doing anything if no data (`dataRows` undefined or omitted and `options.data` undefined).
     *
     * @param {function|object[]} [dataRows=options.data] - Array of uniform data row objects or function returning same.
     *
     * @param {object} [options] - _(Promoted to first argument position when `dataRows` omitted.)_
     *
     * @param {function|object[]} [options.data] - Passed to behavior constructor. May be:
     * * An array of congruent raw data objects
     * * A function returning same
     * * Omit for non-local datasources
     *
     * @param {function|menuItem[]} [options.schema] - Passed to behavior constructor. May be:
     * * A schema array
     * * A function returning same. Called at filter reset time with behavior as context.
     * * Omit to allow the data model to generate a basic schema from its data.
     *
     * @param {boolean} [options.apply=true] Apply data transformations to the new data.
     */
    setData: function(dataRows, options) {
        if (!(Array.isArray(dataRows) || typeof dataRows === 'function')) {
            options = dataRows;
            dataRows = options && options.data;
        }

        dataRows = this.unwrap(dataRows);

        if (dataRows === undefined) {
            return;
        }

        if (!Array.isArray(dataRows)) {
            throw 'Expected data to be an array (of data row objects).';
        }

        options = options || {};

        var grid = this.grid,
            schema = this.unwrap(options.schema), // *always* define a new schema on reset
            schemaChanged = schema || !this.subgrids.lookup.data.getColumnCount(), // schema will change if a new schema was provided OR data model has an empty schema now, which triggers schema generation on setData below
            reindex = options.apply === undefined || options.apply; // defaults to true

        // Inform interested data models of data.
        this.subgrids.forEach(function(dataModel) {
            dataModel.setData(dataRows, schema);
        });

        if (grid.cellEditor) {
            grid.cellEditor.cancelEditing();
        }

        if (reindex) {
            this.reindex();
        }

        if (schemaChanged) {
            this.createColumns();
        }

        grid.allowEvents(this.getRowCount());
    },

    /**
     * Create a new data model
     * @param {object} [options]
     * @param {dataModelAPI} [options.dataModel] - A fully instantiated data model object.
     * @param {function} [options.DataModel=require('datasaur-local')] - Data model will be instantiated from this constructor unless `options.dataModel` was given.
     * @returns {boolean} `true` if the data model has changed.
     * @memberOf Local#
     */
    getNewDataModel: function(options) {
        var newDataModel;

        options = options || {};

        if (options.dataModel) {
            newDataModel = options.dataModel;
        } else if (options.DataModel) {
            newDataModel = new options.DataModel;
        } else {
            newDataModel = new DefaultDataModel;
        }

        return newDataModel;
    },

    /**
     * @summary Attach a data model object to the grid.
     * @desc Installs data model events, fallbacks, and hooks.
     *
     * Called from {@link Behavior#reset}.
     * @this {Behavior}
     * @param {object} [options]
     * @param {dataModelAPI} [options.dataModel] - A fully instantiated data model object.
     * @param {function} [options.DataModel=require('datasaur-local')] - Data model will be instantiated from this constructor unless `options.dataModel` was given.
     * @param {dataModelAPI} [options.metadata] - Passed to {@link dataModelAPI#setMetadataStore setMetadataStore}.
     * @returns {boolean} `true` if the data model has changed.
     * @memberOf Local#
     */
    resetDataModel: function(options) {
        var newDataModel = this.getNewDataModel(options),
            changed = newDataModel && newDataModel !== this.dataModel;

        if (changed) {
            this.dataModel = this.decorateDataModel(newDataModel, options);
            decorators.addDeprecationWarnings.call(this);
            decorators.addFriendlierDrillDownMapKeys.call(this);
        }

        return changed;
    },

    /**
     * @param {dataModelAPI} newDataModel
     * @param {dataModelAPI} [options.metadata] - Passed to {@link dataModelAPI#setMetadataStore setMetadataStore}.
     */
    decorateDataModel: function(newDataModel, options) {
        decorators.addPolyfills(newDataModel);
        decorators.addFallbacks(newDataModel, this.grid);
        decorators.addDefaultHooks(newDataModel);

        newDataModel.setMetadataStore(options && options.metadata);

        return newDataModel;
    },

    /**
     * @summary Convenience getter/setter.
     * @desc Calls the data model's `getSchema`/`setSchema` methods.
     * @see {@link https://fin-hypergrid.github.io/doc/dataModelAPI.html#getSchema|getSchema}
     * @see {@link https://fin-hypergrid.github.io/doc/dataModelAPI.html#setSchema|setSchema}
     * @type {Array}
     * @memberOf Local#
     */
    get schema() {
        return this.dataModel.getSchema();
    },
    set schema(newSchema) {
        this.dataModel.setSchema(newSchema);
    },

    /**
     * @summary Map of drill down characters used by the data model.
     * @see {@link https://fin-hypergrid.github.io/doc/dataModelAPI.html#charMap|charMap}
     * @type {{OPEN:string, CLOSE:string, INDENT:string}}
     * @memberOf Local#
     */
    get charMap() {
        return this.dataModel.drillDownCharMap;
    },

    /**
     * @summary Calls `apply()` on the data model.
     * @see {@link https://fin-hypergrid.github.io/doc/dataModelAPI.html#reindex|reindex}
     * @memberOf Local#
     */
    reindex: function() {
        this.dataModel.apply();
    },

    /**
     * @summary Gets the number of rows in the data subgrid.
     * @see {@link https://fin-hypergrid.github.io/doc/dataModelAPI.html#getRowCount|getRowCount}
     * @memberOf Local#
     */
    getRowCount: function() {
        return this.dataModel.getRowCount();
    },

    /**
     * Retrieve a data row from the data model.
     * @see {@link https://fin-hypergrid.github.io/doc/dataModelAPI.html#getRow|getRow}
     * @memberOf Local#
     * @return {dataRowObject} The data row object at y index.
     * @param {number} y - the row index of interest
     */
    getRow: function(y) {
        return this.deprecated('getRow(y)', 'dataModel.getRow(y)', '3.0.0', arguments, 'We removed grid.getRow(y) and grid.behavior.getRow(). If you are determined to call getRow, call it on the data model directily. However, calling .getRow(y) is not recommended; always try to use .getValue(x, y) instead. See https://github.com/fin-hypergrid/core/wiki/getRow(y)-and-getData()-(ab)use for more information');
    },

    /**
     * Retrieve all data rows from the data model.
     * > Use with caution!
     * @see {@link https://fin-hypergrid.github.io/doc/dataModelAPI.html#getData|getData}
     * @return {dataRowObject[]}
     * @memberOf Local#
     */
    getData: function() {
        return this.dataModel.getData();
    },

    /**
     * @memberOf Local#
     */
    getIndexedData: function() {
        return this.deprecated('getIndexedData()', 'getData()', '3.0.0');
    },

    /**
     * @summary Calls `click` on the data model if column is a tree column.
     * @desc Sends clicked cell's coordinates to the data model.
     * @see {@link https://fin-hypergrid.github.io/doc/dataModelAPI.html#isDrillDown|isDrillDown}
     * @see {@link https://fin-hypergrid.github.io/doc/dataModelAPI.html#click|click}
     * @param {CellEvent} event
     * @returns {boolean} If click was in a drill down column and click on this row was "consumed" by the data model (_i.e., caused it's state to change).
     * @memberOf Local#
     */
    cellClicked: function(event) {
        return this.dataModel.isDrillDown(event.dataCell.x) &&
            this.dataModel.click(event.dataCell.y);
    },

    hasTreeColumn: function(columnIndex) {
        return this.grid.properties.showTreeColumn && this.dataModel.isDrillDown(columnIndex);
    },

    getSelections: function() {
        return this.grid.selectionModel.getSelections();
    }
});

Object.defineProperties(Local.prototype, require('./columnEnum').descriptors);

module.exports = Local;
