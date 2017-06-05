// TODO: Add description

/* ------------------------------------------------------------------------------------------------------------------ */

let mongoose = require('mongoose');
let helper = require('./mongoose');

/* Load the database address from the config file
 * Removes the double quotation mark using replace function
 */
let config = require('config');
let dbConfig = JSON.stringify(config.get('dbConfig').host).replace(/\"/g, '');

let uniqueValidator = require('mongoose-unique-validator');

/* Connect to mongoDB location database */

let Schema = mongoose.Schema;
let roomsDBName = '/rooms';
mongoose.Promise = global.Promise;
let roomsDB = mongoose.createConnection(dbConfig + roomsDBName);

// TODO: Add validation

/* Handling connection errors */
roomsDB.on('error', console.error.bind(console, 'Cannot connect to roomsDB:'));
roomsDB.once('open', function() {
    console.log('Rooms DB Active');
});

let roomsSchema = new Schema({
    id: {
        type: String,
        unique: true,
        required: true,
    },
    users: {
        type: Array,
        default: [],
    },
    selections: {
        type: Array,
        default: [],
    },
});

/*
 * Users for rooms must have the following format:
 * {
 *    location: {
 *                  latitude : Number
 *                  longitude : Number
 *     },
 *     username: String,
 *  }
 *  */

/* Plugin that validates unique entries */
roomsSchema.plugin(uniqueValidator);

/* Pre save function [AUTORUN]
 * Used to initialise fields upon saving
 * */
roomsSchema.pre('save', function(next) {
    // TODO: Handle checks before invoking next
    // Next can be invoked with an error to make it cascade through
    // i.e. new Error('something went wrong')
    next();
});

/* ------------------------------------------------------------------------------------------------------------------ */

let Room = roomsDB.model('Room', roomsSchema);

/* Creates and returns a new database room
 * Parameters:
 *   name = id
 * Returns:
 *   new Room instance */
exports.createNewRoom = function(name) {
    return new Room({
        id: name,
    });
};

/* Saves the current Room into the DB
 * Parameters:
 *   user
 * Returns:
 *   Promise */
exports.saveRoom = function(room) {
    return helper.saveHelper(room);
};

/* Retrieves one Room from the DB
 * Parameters:
 *   Search parameters : { id : 34 }
 * Returns:
 *   Promise */
exports.find = function(p) {
    return helper.findHelper(Room, p);
};

/* Removes a single Room from the DB
 * Parameters:
 *   Search parameters : { id : 34 }
 * Returns:
 *   Promise */
exports.removeRoom = function(p) {
    return helper.removeElem(Room, p);
};

exports.addUser = function(room, username, lat, lng) {
    let query = {
        'users': {
            'latitude': lat,
            'longitude': lng,
            'username': username,
        }};

    let cond = {
        'id': room.id,
    };

    return helper.addHelper(Room, cond, query);
};

exports.updateUser = function(room, username, lat, lng) {
    let query = {
        'users.$.latitude': lat,
        'users.$.longitude': lng,
    };

    let cond = {
        'id': room.id,
        'users.username': username,
    };

    return helper.updateHelper(Room, cond, query);
};


/* Export the User model */
exports.roomModel = Room;

