'use strict';

var warned = {};

var columnEnum = {};

var columnEnumDeprecationDescriptor = {
    get: function() {
        warnColumnEnumDeprecation();
        return columnEnum;
    },
    set: function(x) {
        warnColumnEnumDeprecation();
    }
};

function warnColumnEnumDeprecation() {
    if (!warned.columnEnumDecorators) {
        console.warn('.columnEnumDecorators and .columnEnumKey have both been deprecated as of v3.0.0 and no longer have any meaning. (Will be removed in a future release.) Note that .columnEnum is also deprecated in favor of .schema, which now serves as a column enum. (See https://fin-hypergrid.github.io/doc/dataModel.api#initSchema.)');
        warned.columnEnumDecorators = true;
    }
}

exports.descriptors = {
    columnEnum: {
        get: function() {
            if (!warned.columnEnum) {
                console.warn('.columnEnum has been deprecated as of v3.0.0 in favor of .schema (largely compatible with the deprecated property; see https://fin-hypergrid.github.io/doc/dataModel.api#initSchema). (Will be removed in a future release.)');
                warned.columnEnum = true;
            }
            return this.schema;
        }
    },
    columnEnumKey: columnEnumDeprecationDescriptor,
    columnEnumDecorators: columnEnumDeprecationDescriptor
};
