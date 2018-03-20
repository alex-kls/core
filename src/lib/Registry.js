'use strict';

var Base = require('../Base');

/**
 * @class
 */
var Registry = Base.extend('Registry', {
    /**
     * @summary Register an item and return it.
     * @desc Adds an item to the registry using the provided name (or the class name), converted to all lower case.
     * @param {string} [name] - Case-insensitive item key. If not given, fallsback to `item.prototype.$$CLASS_NAME` or `item.prototype.name` or `item.name`.
     * @param [item] - If unregistered or omitted, nothing is added and method returns `undefined`.
     *
     * > Note: `$$CLASS_NAME` is normally set by providing a string as the (optional) first parameter (`alias`) in your {@link https://www.npmjs.com/package/extend-me|extend} call.
     *
     * @returns Newly registered item or `undefined` if unregistered.
     *
     * @memberOf Registry#
     */
    add: function(name, item) {
        if (typeof name === 'function') {
            item = name;
            name = undefined;
        }

        if (!item) {
            return;
        }

        name = name || item.getClassName && item.getClassName();

        if (!name) {
            throw new this.HypergridError('Cannot register a "' + this.friendlyName() + '" without a name.');
        }

        return (this[name] = item);
    },

    /**
     * @summary Register a synonym for an existing item.
     * @param {string} synonymName
     * @param {string} existingName
     * @returns {function|Constructor} The previously registered item this new synonym points to.
     * @memberOf Registry#
     */
    addSynonym: function(synonymName, existingName) {
        return (this[synonymName] = this.get(existingName));
    },

    /**
     * Fetch a registered item.
     * @param {string} [name]
     * @returns {*|undefined} A registered item or `undefined` if unregistered.
     * @memberOf Registry#
     */
    get: function(name) {
        if (!name) {
            return;
        }

        var result = this[name]; // for performance reasons, do not convert to lower case

        if (!result) {
            var lowerName = name.toLowerCase(); // name may differ in case only
            for (var keys = [], r = this; Object.getPrototypeOf(r) instanceof Registry; r = Object.getPrototypeOf(r)) {
                keys = keys.concat(Object.keys(r));
            }
            var existingName = keys.find(function(key) { return lowerName === key.toLowerCase(); });
            if (existingName) {
                result = this[existingName];
                this.addSynonym(name, existingName); // register found name as a synonym for faster access next time
            }
        }

        if (!result) {
            throw new this.HypergridError('Expected "' + name + '" to be a registered ' + this.friendlyName() + '.');
        }

        return result;
    },

    friendlyName: function() {
        if (this.BaseClass) {
            var name = this.BaseClass.getClassName();
            name = name && name
                .replace(/([A-Z])/g, ' $1')
                .trim()
                .toLowerCase();
        }
        return name || '[unnamed class]';
    }
});


module.exports = Registry;
