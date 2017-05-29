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
        if (err) console.log('[Database] save : error');
        else console.log('[Database] save : success');
    });
};

/* Retrieves one Elem from the DB
 * Parameters:
 *   Search parameters : { name : 'Anne' }
 * Returns:
 *   Promise */
exports.findHelper = function (DB, p) {
    return DB.findOne(p, function(err,obj) {
        if (err) console.log('[Database] find : error');
        else console.log('[Database] find : success');
    });
};

/* Retrieves multiple Elements from the DB
 * Parameters:
 *   Search parameters : { name : 'Anne' }
 * Returns:
 *   Promise */
exports.findMultipleHelper = function (DB, p) {
    return DB.find(p, function(err,obj) {
        if (err) console.log('[Database] find : error');
        return obj;
    }).then(function (elems) {
        if (!elems.length) {
            console.log('[Database] find : error');
            throw new Error('Error while finding within database. Possibly entry not present.');
        }
        else {
            console.log('[Database] find : success');
            return elems;
        }
    });
};

/* Removes a single Element from the DB
 * Parameters:
 *   Search parameters : { name : 'Anne' }
 * Returns:
 *   Promise */
exports.removeElem = function (DB, p) {
    return DB.find(p, function(err,obj) {
        if (err) console.log('[Database] remove : error');
        return obj;
    }).then(function (elems) {
        if (elems.length) {
            return DB.remove(elems[0], function (err, obj) {
                if (err) console.log('[Database] remove : error');
                else {
                    console.log('[Database] remove : success');
                    return obj;
                }
            }).then();
        }
        else {
            console.log('[Database] remove : error');
            throw new Error('Error while removing from database. Possibly entry not present');
        }
    });
};

/* Removes multiple Users from the DB
 * Parameters:
 *   Search parameters : { name : 'Anne' }
 * Returns:
 *   Promise */
exports.removeMultipleHelper = function (DB, p) {
    return DB.find(p, function(err,obj) {
        if (err) console.log('[Database] remove : error');
        return obj;
    }).then(function (elems) {
        if (elems.length) {
            for (var i = 0; i < elems.length; i++) {
                DB.remove(elems[i], function (err, obj) {
                    if (err) console.log('[Database] remove : error');
                    else {
                        console.log('[Database] remove : success');
                        return obj;
                    }
                }).then();
            }
        }
        else {
            console.log('[Database] remove : error');
            throw new Error('Error while removing from database. Possibly entry not present');
        }
    });
};