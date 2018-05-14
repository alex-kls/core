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
        const oldColumns = this.columns;
        const oldAllColumns = this.allColumns;

        Behavior.prototype.createColumns.call(this);

        this.schema.forEach(function(columnSchema, index) {
            const findFunction = function(c) {
                return c.properties.index === index &&
                    c.properties.name === columnSchema.name &&
                    c.properties.calculator === columnSchema.calculator &&
                    c.colDef === columnSchema.colDef;
            };
            const oldColumn = oldAllColumns.find(findFunction) || oldColumns.find(findFunction);
            const oldColumnColdDef = oldAllColumns.find(c => c.colDef && c.colDef === columnSchema.colDef) || oldColumns.find(c => c.colDef === columnSchema.colDef);

            if (oldColumn) {
                const newColumn = this.addColumn(oldColumn.properties);
                const props = newColumn.properties;

                // disable resizing for old resized columns
                // when data was added to existed array of data
                if (props.width === props.preferredWidth && props.columnAutosizing && props.columnAutosized) {
                    props.columnAutosizing = false;
                }
            } else {
                const newColumn = this.addColumn({
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
                } else if (oldColumnColdDef) {
                    const props = oldColumnColdDef.properties;

                    // disable resizing for old resized columns
                    // when data was added to existed array of data
                    Object.assign(newColumn.properties, {
                        width: props.width,
                        preferredWidth: props.preferredWidth,
                        columnAutosizing: props.columnAutosizing,
                        columnAutosized: props.columnAutosized,
                    });
                }

                if (columnSchema.formatter) {
                    newColumn.properties.format = newColumn.name;
                    newColumn.schema.format = newColumn.name;
                    const options = {
                        name: newColumn.name,
                        format: columnSchema.formatter, // called for render view
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
            xOrColumn = this.getColumn(xOrColumn);
        }

        const column = xOrColumn;
        const data = this.getData();
        const gc = this.grid.canvas.gc;

        const props = column.properties;

        let width = column.width || props.defaultColumnWidth;

        // get max width based of
        data.forEach((d, i) => {
            let val = column.getValue(i);
            if (val && (typeof val !== 'object' || val instanceof Array)) {
                const widths = {};

                const dataProps = this.getRowProperties(i) || props;
                widths.cellPaddingRight = props.cellPaddingRight;

                if (dataProps.showCellContextMenuIcon) {
                    gc.cache.font = props.contextMenuIconFont;
                    widths.showCellContextMenuIcon = props.contextMenuButtonIconPreferedWidth + 2 * props.contextMenuButtonPadding + props.contextMenuLeftSpaceToCutText;
                }

                if (dataProps.showColumnType && column.schema.colTypeSign) {
                    widths.colTypeSign = (widths.showCellContextMenuIcon || 0) + widths.cellPaddingRight;
                }

                if (column.schema && column.schema.headerPrefix && dataProps.headerRow) {
                    gc.cache.font = props.columnTitlePrefixFont;
                    widths.headerPrefix = gc.getTextWidth(column.schema.headerPrefix) + props.columnTitlePrefixRightSpace;
                }

                if (column.hasError && dataProps.headerRow) {
                    gc.cache.font = props.errorIconFont;
                    widths.hasError = gc.getTextWidth(props.errorIconUnicodeChar) + props.columnTitlePrefixRightSpace;
                }

                if (column.name === '$$aggregation') {
                    const treeLevel = this.getRowTreeLevel(d);
                    const treeOffset = treeLevel ? this.getRowTreeLevel(d) * props.aggregationGroupTreeLevelOffset : 0;
                    widths.treeOffset = treeOffset;

                    const aggregationCount = this.getAggregationChildCount(d);
                    if (aggregationCount > 0) {
                        gc.cache.font = props.cellValuePostfixFont;
                        widths.aggregationCount = props.cellPaddingLeft + treeOffset + gc.getTextWidth(`(${aggregationCount})`) + props.cellValuePostfixLeftOffset;
                    }

                    if (this.isExpandableRow(d)) {
                        const valuePrefix = props[`aggregationGroupExpandIcon${ this.isRowExpanded(d) ? 'Collapsed' : 'Expanded'}Char`];
                        if (valuePrefix) {
                            gc.cache.font = props.aggregationGroupExpandIconFont;
                            widths.valuePrefix = gc.getTextWidth(valuePrefix) + props.columnTitlePrefixRightSpace;
                        }
                    }
                }

                const count = column.getCount(i);
                if (count !== undefined) {
                    gc.cache.font = props.cellValuePostfixFont;
                    widths.valuePostfix = gc.getTextWidth(`(${count})`) + props.cellValuePostfixLeftOffset;
                }

                gc.cache.font = dataProps.font;
                widths.val = gc.getTextWidth(this.grid.formatValue(column.name, val, dataProps.headerRow)) + props.cellPaddingLeft;

                // console.log('widths', val, widths);
                let textWidth = Object.values(widths).reduce((a, b) => a + b, 0);
                // console.log('textWidth', textWidth);

                const colspan = this.dataModel.getColspan(column.index, i);
                if (colspan > 0) {
                    textWidth = textWidth / (colspan + 1);
                    for (let i = column.index; i <= column.index + colspan; ++i) {
                        this.getColumn(i).width = textWidth;
                    }
                }

                if (textWidth > width) {
                    width = textWidth;
                }
            }
        });

        if (width > props.maxWidth) {
            width = props.maxWidth;
        }

        props.preferredWidth = Math.ceil(width);

        if (force || props.columnAutosizing) {
            if (props.preferredWidth > 0) {
                column.setWidth(props.preferredWidth);
            }
        }
    },

    fitColumns: function() {
        var gc = this.grid.canvas.gc;
        var oldFont = gc.cache.font;
        this.allColumns.forEach(c => this.fitColumn(c));
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
                if (value && typeof value === 'object' && value.type === 'ERROR') {
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
        return this.dataModel.getRow(y);
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

    /**
     * @summary extend row data with aggregation name from parent row
     * @param row - row structure which will be populated with new agg data
     * @param parentParentAggs - agg data from previous row data
     */
    populateAggregationNamesForRow(row, parentParentAggs) {
        if (row.__treeLevel !== undefined && row.$$aggregation !== undefined) {
            let parentAggs = Object.assign({}, row.parentAggs || (this.grid.properties.isPivot ? {} : parentParentAggs) || {}); // copy parentAggs
            parentAggs[`$$aggregation${row.__treeLevel}`] = row.$$aggregation;
            Object.assign(row, parentAggs, { parentAggs });
        }
    },

    /**
     * @desc append child rows right after parent
     * @type {boolean}
     * @memberOf CellEvent#
     */
    expandChildRows: function(rowOrIndex) {
        const row = typeof rowOrIndex === 'object' ? rowOrIndex : this.grid.getRow(rowOrIndex);
        if (!row.$$open && row.$$children) {
            this.populateAggregationNamesForRow(row);
            if (row.$$children.length > 0) {
                const rowIndex = this.dataModel.data.indexOf(row);
                this.dataModel.addRows(row.$$children, rowIndex + 1);
                row.$$children.forEach(r => {
                    this.populateAggregationNamesForRow(r, row.parentAggs);
                    r.$$parentRow = row;
                });

                // remove column because of flat mode
                if (!this.grid.properties.isPivot) {
                    this.dataModel.data.splice(rowIndex, 1);
                }
                this.flatReady = false;
            }
        }
        row.$$open = true;
    },

    /**
     * @desc set colDefs group state to open and synchronize schema
     * @type {boolean}
     * @memberOf CellEvent#
     */
    expandChildColumns: function(groupId) {
        this._setColDefGroupShowStateRecursive(this.grid.columnDefs, groupId, 'open');

        this.synchronizeSchemaToColumnDefs();
        // this.recalculateColumnSizes();
    },

    /**
     * @desc set colDefs group state to closed and synchronize schema
     * @type {boolean}
     * @memberOf CellEvent#
     */
    collapseChildColumns: function(groupId) {
        this._setColDefGroupShowStateRecursive(this.grid.columnDefs, groupId, 'closed');

        this.synchronizeSchemaToColumnDefs();
        // this.recalculateColumnSizes();
    },

    /**
     * @desc utility function to recursively found colDefs group by id and set it's open state
     * @param {array} colDefs
     * @param {number} groupId
     * @param {string} newState
     * @type {boolean}
     * @memberOf CellEvent#
     */
    _setColDefGroupShowStateRecursive: function(colDefs, groupId, newState) {
        colDefs.forEach(cd => {
            if (cd.groupId === groupId) {
                cd.columnGroupShow = newState;
            }

            if (cd.children && cd.children.length > 0) {
                this._setColDefGroupShowStateRecursive(cd.children, groupId, newState);
            }
        });
    },

    /**
     * @summary set all rows expanded in one time
     */
    buildFlatMode: function() {
        do {
            this.flatReady = true;
            this.dataModel.data.forEach(row => this.expandChildRows(row));
        } while (!this.flatReady);

        this.dataModel.cache = [];
    },

    /**
     * @desc remove all child rows from data model
     * @type {boolean}
     * @memberOf CellEvent#
     */
    collapseChildRows: function(rowOrIndex) {
        const row = typeof rowOrIndex === 'object' ? rowOrIndex : this.grid.getRow(rowOrIndex);
        if (row.$$open && row.$$children && row.$$children.length > 0) {
            let dataToDelete = this.dataModel.data.filter((d) => d.$$parentRow === row);
            dataToDelete.forEach(dtd => {
                this.collapseChildRows(dtd);
                this.dataModel.data = this.dataModel.data.filter((d) => d !== dtd);
            });
        }
        row.$$open = false;
    },


    /**
     * @summary get additional width based on colspan
     * @param x
     * @param y
     * @returns {number}
     */
    getAdditionalWidth: function(x, y) {
        return this.dataModel.getAdditionalWidth(x, y);
    },

    /**
     * @summary get additional height based on rowspan
     * @param x
     * @param y
     * @returns {number}
     */
    getAdditionalHeight: function(x, y) {
        return this.dataModel.getAdditionalHeight(x, y);
    },

    /**
     * @public
     * @desc get colspan of an cell, if exist. Otherwise, returns 0;
     * @param x
     * @param y
     * @return {*}
     */
    getColspan: function(x, y) {
        return this.dataModel.getColspan(x, y);
    },

    /**
     * @public
     * @desc get rowspan of an cell, if exist. Otherwise, returns 0;
     * @param x
     * @param y
     * @return {*}
     */
    getRowspan: function(x, y) {
        return this.dataModel.getRowspan(x, y);
    },

    errors: {}
});

Object.defineProperties(Local.prototype, require('./columnEnum').descriptors);

module.exports = Local;
