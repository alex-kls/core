'use strict';

var Behavior = require('./Behavior');

/** @name DataSource
 * @memberOf Behavior#
 * @default require('datasaur-local')
 * @summary Default data source.
 * @desc If defined, will be used as a default data source for newly instantiated `Hypergrid` objects without `DataSource` or `dataSource` options specified. Scheduled for removal in next version (v4).
 */
var DefaultDataModel = require('../DatasaurLocal');

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
        var oldColumns = this.columns;
        var oldAllColumns = this.allColumns;

        Behavior.prototype.createColumns.call(this);

        this.schema.forEach(function(columnSchema, index) {
            var findFunction = function(c) {
                return c.properties.index === index &&
                    c.properties.name === columnSchema.name &&
                    c.properties.calculator === columnSchema.calculator &&
                    c.colDef === columnSchema.colDef;
            };
            var oldColumn = oldAllColumns.find(findFunction) || oldColumns.find(findFunction);
            if (oldColumn) {
                var newColumn = this.addColumn(oldColumn.properties);
                var props = newColumn.properties;

                // disable resizing for old resized columns
                // when data was added to existed array of data
                if (props.width === props.preferredWidth && props.columnAutosizing && props.columnAutosized) {
                    props.columnAutosizing = false;
                }
            } else {
                newColumn = this.addColumn({
                    index: index,
                    header: columnSchema.header,
                    calculator: columnSchema.calculator,
                    colDef: columnSchema.colDef
                });

                // restore width from previous schema when data just refreshed.
                // this is needed because of almost total refresh of grid
                if (columnSchema.width) {
                    Object.assign(newColumn.properties, {
                        width: columnSchema.width,
                        columnAutosizing: false
                    });
                }

                if (columnSchema.formatter) {
                    newColumn.properties.format = newColumn.name;
                    newColumn.schema.format = newColumn.name;
                    const options = {
                        name: newColumn.name,
                        format: (value, config) => (config === undefined) ? value : columnSchema.formatter(value, config.dataRow), // called for render view
                        parse: value => value, // called for render value in editor
                        locale: 'en'
                    };
                    this.grid.localization.add(newColumn.name, options);
                }

                ['halign', 'maxWidth', 'cellContextMenu'].forEach(function(key) {
                    if (columnSchema[key]) {
                        newColumn.properties[key] = columnSchema[key];
                    }
                });
            }
        }, this);
    },

    fitColumn: function(xOrColumn, force) {
        if (typeof xOrColumn !== 'object') {
            xOrColumn = this.grid.behavior.getColumn(xOrColumn);
        }

        const column = xOrColumn;
        const data = this.getData();
        const gc = this.grid.canvas.gc;

        const props = column.properties;

        let width = props.defaultColumnWidth;
        const key = column.properties.field;
        const formatter = this.grid.getFormatter(column.name);

        // get max width based of
        data.forEach((d, i) => {
            if (d[key]) {
                const dataProps = this.getRowProperties(i) || props;
                let textWidth = props.cellPaddingRight;

                if (dataProps.showCellContextMenuIcon) {
                    gc.cache.font = props.contextMenuIconFont;
                    textWidth += props.contextMenuButtonIconPreferedWidth + 2 * props.contextMenuButtonPadding + props.contextMenuLeftSpaceToCutText;
                }

                if (dataProps.showColumnType && column.schema.colTypeSign) {
                    textWidth += textWidth;
                }

                if (column.schema && column.schema.headerPrefix) {
                    gc.cache.font = props.columnTitlePrefixFont;
                    textWidth += gc.getTextWidth(props.contextMenuIconUnicodeChar) + props.columnTitlePrefixRightSpace;
                }

                if (column.hasError && dataProps.headerRow) {
                    gc.cache.font = props.errorIconFont;
                    textWidth += gc.getTextWidth(props.errorIconUnicodeChar) + props.columnTitlePrefixRightSpace;
                }

                gc.cache.font = dataProps.font;
                textWidth += gc.getTextWidth(formatter(d[key], Object.assign({}, dataProps, { dataRow: d }))) + props.cellPaddingLeft;

                if (textWidth > width) {
                    width = textWidth;
                }
            }
        });

        width = Math.ceil(width);

        props.preferredWidth = width;

        if (force || props.columnAutosizing) {
            if (width > 0) {
                column.setWidth(props.preferredWidth);
            }
        }
    },

    fitColumns: function() {
        var gc = this.grid.canvas.gc;
        var oldFont = gc.cache.font;
        this.allColumns.forEach(c => this.fitColumn.bind(this)(c));
        gc.cache.font = oldFont;
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

        // copy widths from old schema
        if (schemaChanged && this.schemaOld && schema) {
            var schemaOld = this.schemaOld;
            schema.forEach(function(columnSchema, index) {
                if (schemaOld[index] && index === schemaOld[index].index && columnSchema.name === schemaOld[index].name && schemaOld[index].width) {
                    columnSchema.width = schemaOld[index].width;
                }
            });
        }

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

        this.checkForErrors();

        grid.allowEvents(this.getRowCount());
    },

    /**
     * @memberOf Local#
     * @summary Add grid data.
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
    addData: function(dataRows, options) {
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
            if (dataModel.addData) {
                dataModel.addData(dataRows, schema);
            }
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

        this.checkForErrors();

        grid.allowEvents(this.getRowCount());
    },

    getColumnsErrors: function() {
        return this.errors;
    },

    checkForErrors: function() {
        this.errors = {};

        this.getData().forEach(row => {
            Object.keys(row).forEach(columnName => {
                const value = row[columnName];
                if (typeof value === 'object' && value.type === 'ERROR') {
                    if (!this.errors[columnName]) {
                        this.errors[columnName] = [];
                    }
                    this.errors[columnName].push(value);
                }
            });
        });

        this.errorCount = Object.keys(this.errors).length;

        if (this.errorCount) {
            Object.keys(this.errors).forEach(columnName => {
                const column = this.grid.getColumnByName(columnName);
                if (column) {
                    column.hasError = true;
                    column.errorCount = this.errors[columnName].length;
                    column.firstError = this.errors[columnName][0];

                    const colDef = column.colDef;
                    if (colDef) {
                        colDef.errorCount = this.errors[columnName].length;
                    }
                }
            });
        }
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
        return this.dataModel && this.dataModel.getSchema();
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
    },

    errors: {}
});

Object.defineProperties(Local.prototype, require('./columnEnum').descriptors);

module.exports = Local;
