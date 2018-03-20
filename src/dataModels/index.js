'use strict';

var Registry = require('../lib/Registry');

/**
 * @classdesc Registry of cell editor constructors.
 * @param {object} options
 * @constructor
 */
var DataModels = Registry.extend('DataModels', {

    BaseClass: require('../DatasaurBase'),

    initialize: function() {
        // preregister the standard cell editors
        this.add(require('./HeaderSubgrid'));
    }

});

module.exports = new DataModels;
