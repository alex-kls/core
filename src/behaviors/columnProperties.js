'use strict';

/**
 * @this {Column}
 * @returns {object}
 * @memberOf Column#
 */
function createColumnProperties() {
    var column = this,
        gridProps = column.behavior.grid.properties,
        properties;

    properties = Object.create(gridProps, {

        index: { // read-only (no setter)
            get: function() {
                return column.index;
            }
        },

        name: { // read-only (no setter)
           get: function() {
                return column.name;
            }
        },

        field: { // read-only (no setter)
            get: function() {
                return column.name;
            }
        },

        columnName: { // read-only (no setter)
            get: function() {
                return column.name;
            }
        },

        header: {
            get: function() {
                return column.header;
            },
            set: function(header) {
                if (this !== column.properties) {
                    // trying to set a cell header
                    gridProps.header = header; // throw same error as when trying to set a grid header
                }
                column.header = header;
            }
        },

        type: {
            get: function() {
                return column.type;
            },
            set: function(type) {
                if (this !== column.properties) {
                    // trying to set a cell type
                    gridProps.type = type; // throw same error as when trying to set a grid type
                }
                column.type = type;
            }
        },

        calculator: {
            get: function() {
                return column.calculator;
            },
            set: function(calculator) {
                if (this !== column.properties) {
                    // trying to set a cell calculator
                    gridProps.calculator = calculator; // throw same error as when trying to set a grid calculator
                }
                column.calculator = calculator;
            }
        },

        format: {
            get: function() {
                return 'format' in column.schema ? column.schema.format : gridProps.format;
            },
            set: function(format) {
                if (this !== column.properties) {
                    // set on instance to override this accessor (could be cell props obj or anon obj created by renderer)
                    Object.defineProperty(this, 'format', {
                        enumerable: true,
                        configurable: true,
                        writable: true,
                        value: format
                    });
                } else if (format === undefined) {
                    delete column.schema.format; // remove column prop to so getter returns grid prop
                } else {
                    column.schema.format = format;
                }
            }
        },

        renderer: {
            get: function() {
                return 'renderer' in column.schema ? column.schema.renderer : gridProps.renderer;
            },
            set: function(renderer) {
                if (this !== column.properties) {
                    // set on instance to override this accessor (could be cell props obj or anon obj created by renderer)
                    Object.defineProperty(this, 'renderer', {
                        enumerable: true,
                        configurable: true,
                        writable: true,
                        value: renderer
                    });
                } else if (renderer === undefined) {
                    delete column.schema.renderer; // remove column prop to so getter returns grid prop
                } else {
                    column.schema.renderer = renderer;
                }
            }
        },

        toJSON: {
            // although we don't generally want these to be enumerable, we do want them to be serializable
            // todo: ??? not sure now (3/13/2018) why these shouldn't be enumerable
            value: function() {
                return Object.assign({
                    header: this.header,
                    type: this.type,
                    calculator: this.calculator,
                    format: this.format,
                    renderer: this.renderer
                }, this);
            }
        }

    });

    Object.defineProperties(properties, {
        rowHeader: { value: Object.create(properties, createColumnProperties.rowHeaderDescriptors) },
        treeHeader: { value: Object.create(properties, createColumnProperties.treeHeaderDescriptors) },
        columnHeader: { value: Object.create(properties, createColumnProperties.columnHeaderDescriptors) },
        filterProperties: { value: Object.create(properties, createColumnProperties.filterDescriptors) }
    });

    return properties;
}

createColumnProperties.treeHeaderDescriptors = {
    font: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.treeHeaderFont;
        },
        set: function(value) {
            this.treeHeaderFont = value;
        }
    },
    color: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.treeHeaderColor;
        },
        set: function(value) {
            this.treeHeaderColor = value;
        }
    },
    backgroundColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.treeHeaderBackgroundColor;
        },
        set: function(value) {
            this.treeHeaderBackgroundColor = value;
        }
    },
    foregroundSelectionFont: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.treeHeaderForegroundSelectionFont;
        },
        set: function(value) {
            this.treeHeaderForegroundSelectionFont = value;
        }
    },
    foregroundSelectionColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.treeHeaderForegroundSelectionColor;
        },
        set: function(value) {
            this.treeHeaderForegroundSelectionColor = value;
        }
    },
    renderer: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.treeRenderer;
        },
        set: function(value) {
            this.treeRenderer = value;
        }
    },
    backgroundSelectionColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.treeHeaderBackgroundSelectionColor;
        },
        set: function(value) {
            this.treeHeaderBackgroundSelectionColor = value;
        }
    }
    //leftIcon: undefined
};

createColumnProperties.rowHeaderDescriptors = {
    font: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.rowHeaderFont;
        },
        set: function(value) {
            this.rowHeaderFont = value;
        }
    },
    color: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.rowHeaderColor;
        },
        set: function(value) {
            this.rowHeaderColor = value;
        }
    },
    backgroundColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.rowHeaderBackgroundColor;
        },
        set: function(value) {
            this.rowHeaderBackgroundColor = value;
        }
    },
    foregroundSelectionFont: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.rowHeaderForegroundSelectionFont;
        },
        set: function(value) {
            this.rowHeaderForegroundSelectionFont = value;
        }
    },
    foregroundSelectionColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.rowHeaderForegroundSelectionColor;
        },
        set: function(value) {
            this.rowHeaderForegroundSelectionColor = value;
        }
    },
    backgroundSelectionColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.rowHeaderBackgroundSelectionColor;
        },
        set: function(value) {
            this.rowHeaderBackgroundSelectionColor = value;
        }
    },
    leftIcon: {
        configurable: true,
        enumerable: true,
        get: function() {
            if (this.grid.properties.rowHeaderCheckboxes) {
                var result;
                if (this.isDataRow) {
                    result = this.isRowSelected ? 'checked' : 'unchecked';
                } else if (this.isHeaderRow) {
                    result = this.allRowsSelected ? 'checked' : 'unchecked';
                } else if (this.isFilterRow) {
                    result = 'filter-off';
                }
                return result;
            }
        },
        set: function(value) {
            // replace self with a simple instance var
            Object.defineProperty(this, 'leftIcon', {
                configurable: true,
                enumerable: true,
                writable: true,
                value: value
            });
        }
    }
};

createColumnProperties.filterDescriptors = {
    font: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.filterFont;
        },
        set: function(value) {
            this.filterFont = value;
        }
    },
    color: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.filterColor;
        },
        set: function(value) {
            this.filterColor = value;
        }
    },
    backgroundColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.filterBackgroundColor;
        },
        set: function(value) {
            this.filterBackgroundColor = value;
        }
    },
    foregroundSelectionColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.filterForegroundSelectionColor;
        },
        set: function(value) {
            this.filterForegroundSelectionColor = value;
        }
    },
    backgroundSelectionColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.filterBackgroundSelectionColor;
        },
        set: function(value) {
            this.filterBackgroundSelectionColor = value;
        }
    },
    halign: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.filterHalign;
        },
        set: function(value) {
            this.filterHalign = value;
        }
    },
    renderer: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.filterRenderer;
        },
        set: function(value) {
            this.filterRenderer = value;
        }
    },
    editor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.filterEditor;
        },
        set: function(value) {
            this.filterEditor = value;
        }
    },
    rightIcon: {
        configurable: true,
        enumerable: true,
        get: function() {
            var result;
            if (this.filterable) {
                result = this.filter ? 'filter-on' : 'filter-off';
            }
            return result;
        },
        set: function(value) {
            // replace self with a simple instance var
            Object.defineProperty(this, 'rightIcon', {
                configurable: true,
                enumerable: true,
                writable: true,
                value: value
            });
        }
    }
};

createColumnProperties.columnHeaderDescriptors = {
    font: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.columnHeaderFont;
        },
        set: function(value) {
            this.columnHeaderFont = value;
        }
    },
    color: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.columnHeaderColor;
        },
        set: function(value) {
            this.columnHeaderColor = value;
        }
    },
    backgroundColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.columnHeaderBackgroundColor;
        },
        set: function(value) {
            this.columnHeaderBackgroundColor = value;
        }
    },
    foregroundSelectionFont: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.columnHeaderForegroundSelectionFont;
        },
        set: function(value) {
            this.columnHeaderForegroundSelectionFont = value;
        }
    },
    foregroundSelectionColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.columnHeaderForegroundSelectionColor;
        },
        set: function(value) {
            this.columnHeaderForegroundSelectionColor = value;
        }
    },
    backgroundSelectionColor: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.columnHeaderBackgroundSelectionColor;
        },
        set: function(value) {
            this.columnHeaderBackgroundSelectionColor = value;
        }
    },
    halign: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.columnHeaderHalign;
        },
        set: function(value) {
            this.columnHeaderHalign = value;
        }
    },
    renderer: {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.columnHeaderRenderer;
        },
        set: function(value) {
            this.columnHeaderRenderer = value;
        }
    },
    leftIcon: { writable: true, value: undefined},
    centerIcon: { writable: true, value: undefined},
    rightIcon: { writable: true, value: undefined},
};

/**
 * Column.js mixes this module into its prototype.
 * @mixin
 */
exports.mixin = {
    createColumnProperties: createColumnProperties
};
