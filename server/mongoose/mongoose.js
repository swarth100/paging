/* Mongoose generic helper functions */

/* ------------------------------------------------------------------------------------------------------------------ */
var exports = module.exports = {};

/* Saves the current Element onto the DB
 * Parameters:
 *   elem
 * Returns:
 *   Promise */
exports.saveHelper = function (elem) {
    return elem.save(function (err) {
        if (err) console.log('Error while saving.');
        else console.log('Success while saving.');
    });
};

/* Retrieves one Elem from the DB
 * Parameters:
 *   Search parameters : { name : 'Anne' }
 * Returns:
 *   Promise */
exports.findHelper = function (DB, p) {
    return DB.findOne(p, function(err,obj) {
        if (err) console.log('Error while finding.');
        else console.log('Success while finding.');
    });
};

/* Retrieves multiple Elements from the DB
 * Parameters:
 *   Search parameters : { name : 'Anne' }
 * Returns:
 *   Promise */
exports.findMultipleHelper = function (DB, p) {
    return DB.find(p, function(err,obj) {
        if (err) console.log('Error while finding');
        return obj;
    }).then(function (elems) {
        if (!elems.length) throw new Error('Error while finding');
        else return elems;
    });
};

/* Removes a single Element from the DB
 * Parameters:
 *   Search parameters : { name : 'Anne' }
 * Returns:
 *   Promise */
exports.removeElem = function (DB, p) {
    return DB.find(p, function(err,obj) {
        if (err) console.log('Error while finding (upon removing)');
        return obj;
    }).then(function (elems) {
        if (elems.length) {
            return DB.remove(elems[0], function (err, obj) {
                if (err) console.log('Error while removing (upon finding)');
                return obj;
            }).then();
        }
        else throw new Error('Error while removing');
    });
};

/* Removes multiple Users from the DB
 * Parameters:
 *   Search parameters : { name : 'Anne' }
 * Returns:
 *   Promise */
exports.removeMultipleHelper = function (DB, p) {
    return DB.find(p, function(err,obj) {
        if (err) console.log('Error while finding (upon removing)');
        return obj;
    }).then(function (elems) {
        if (elems.length) {
            for (var i = 0; i < elems.length; i++) {
                DB.remove(elems[i], function (err, obj) {
                    if (err) console.log('Error while removing (upon finding)');
                    return obj;
                }).then();
            }
        }
        else throw new Error('Error while removing');
    });
};
