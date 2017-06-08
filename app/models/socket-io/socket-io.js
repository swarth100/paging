
let mongooseRoom = require('../mongoose/rooms');
let googlemaps = require('../googlemaps/googlemaps');

let colours = {
    grey: '#737373',
    yellow: '#ffff00',
    orange: '#ff9900',
    darkOrange: '#993300',
    // red: '#ff3300',
    pink: '#ff33cc',
    purple: '#993399',
    darkPurple: '#660066',
    purpleBlue: '#9900cc',
    blue: '#333399',
    darkBue: '#000066',
    electricBlue: '#0000ff',
    lightBlue: '#0099ff',
    green: '#00ff00',
    darkGreen: '#009933',
    darkerGreen: '#003300',
    creamGreen: '#669900',
    brown: '#996633',
    darkBrown: '#663300',
};

exports.start = (server) => {
    /* Starts socket.io to be listening on the specific server */
    let io = require('socket.io').listen(server);

    /* Listens for 'connection' messages
     * 'connection' messages are issues by front-end socket-io.js via the
     * io.connect() command */
    io.on('connection', function(socket) {
        /* Triggered by joining a new room */
        socket.on('join', (roomID) => {
            socket.room = roomID;
            socket.join(roomID);

            socket.emit('messages', 'thank you for joining ' + roomID);

            /* Looks into the database to find an object corresponding to
             the given roomID.
             * If a room is not found a new room is created.
             * If this fails as well, then a very serious error has occured
             * and the application should not be able to proceed.*/
            findRoom(roomID, function() {
                /* Emit back a joinSuccess message */
                socket.emit('joinSuccess');
            });
        });

        socket.on('leave', (data) => {
            socket.leave(data);
        });

        /* Triggered upon changing one of the per-user location fields:
         * location
         * radius
         *  */
        socket.on('location', (data) => {
            console.log('Location is being updated');
            findUserViaRoom(socket, data, function() {
                broadcastSubmit(socket);
            });
        });

        /* Triggered upon changing one of the options:
         * duration
         * datetime
         * types
         *  */
        socket.on('options', (data) => {
            console.log('Options have been updated');
            findRoomNoSave(socket.room, function(room) {
                /* Update the options */
                mongooseRoom.updateOptions(room, data)
                    .then(function(room) {
                        /* Room already exists in the DB */
                        console.log('Update OPTIONS success in results');

                        broadcastRefresh(socket);
                    })
                    .catch(function(err) {
                        /* Room must be created in the DB */
                        console.log('Update rooms options ERROR. Something horrible. Should never happen');
                    });
            });
        });

        /* Triggered upon searching */
        socket.on('search', (data) => {
            findRoomNoSave(socket.room, function(room) {
                /* Call googleAPI */
                googlemaps.temporaryFunction(room, function(results) {
                    mongooseRoom.updateRoom(room, results)
                        .then(function(room) {
                            /* Room already exists in the DB */
                            console.log('Update success in results');

                            broadcastSubmit(socket);
                        })
                        .catch(function(err) {
                            /* Room must be created in the DB */
                            console.log('Update rooms ERROR. Something horrible. Should never happen');
                        });
                });
            });
        });

        /* Never really used. Meant to broadcast to a socket, except sender */
        socket.on('broadcast', (data) => {
            /* Add backend catch for messages being posted via the socket */
            if (data.eventName === 'messages') {
                console.log('Message has been sent');
            }

            socket.broadcast.to(data.room).emit(data.eventName, data.data);
        });
    });

    function findRoom(roomID, cb) {
        mongooseRoom.find({'id': roomID})
            .then(function(room) {
                /* Room already exists in the DB */
                console.log('Room already exists and found');

                cb();
            })
            .catch(function(err) {
                /* Room must be created in the DB */
                console.log('New room has been created');

                /* Room must be created and saved into the DB */
                let room = mongooseRoom.createNewRoom(roomID);
                saveRoom(room, cb);
            });
    }

    function findRoomNoSave(roomID, cb) {
        mongooseRoom.find({'id': roomID})
            .then(function(room) {
                /* Room already exists in the DB */
                console.log('Room already exists and found');
                cb(room);
            })
            .catch(function(err) {
                /* Room must be created in the DB */
                console.log('Find room ERROR');
            });
    }

    function saveRoom(room, cb) {
        mongooseRoom.saveRoom(room)
            .then(function(room) {
                /* Room has been saved into the DB with success */
                console.log('Saved with success.');

                cb();
            })
            .catch(function(err) {
                /* An unexpected error occurred while saving the room */
                console.log('Error occurred while saving to the database');
            });
    }

    function findUserViaRoom(socket, user, cb) {
        mongooseRoom.find({'id': socket.room})
            .then(function(room) {
                /* Room already exists in the DB */
                console.log('Room found in the DB');

                /* Attempt to update the given user in the DB */
                updateUser(room, user, cb);
            })
            .catch(function(err) {
                console.log('Room could not be found on DB');
            });
    }

    function updateUser(room, user, cb) {
        mongooseRoom.updateUser(room, user)
            .then(function(room) {
                /* User was already present in the room. User's coords have been updated */
                console.log('Found user, updated values!');

                /* TODO: ADD comment */
                cb();
            })
            .catch(function(err) {
                /* User is not present in the room */
                console.log('User not present in room. Create (and add) new user');
                addUser(room, user, cb);
            });
    }

    /* Helper function to search through color array and select one */
    function chooseSemiRandomColour() {
        let keys = Object.keys(colours);

        let randomIndex = Math.floor(Math.random() * keys.length);

        return colours[keys[randomIndex]];
    }

    function addUser(room, user, cb) {
        /* Assign each user a random color from a selection */
        user.color = chooseSemiRandomColour();

        /* Assign each user a random color before saving them */
        mongooseRoom.addUser(room, user)
            .then(function(room) {
                console.log('Saved new user with given values');

                cb();
            })
            .catch(function(err) {
                console.log('Failed to save new user. Something went horribly wrong.');
            });
    }

    function broadcastGeneral(socket, val) {
        let findPromise = mongooseRoom.find({'id': socket.room});
        findPromise
            .then(function(room) {
                console.log('Found the relevant room');

                /* Broadcast the found room to the channel with an update */
                io.in(socket.room).emit(val, room);
            })
            .catch(function(err) {
                console.log('No element in the database meets the search criteria');
            });
    }

    function broadcastSubmit(socket) {
        broadcastGeneral(socket, 'update');
    }

    function broadcastRefresh(socket) {
        broadcastGeneral(socket, 'refresh');
    }
};