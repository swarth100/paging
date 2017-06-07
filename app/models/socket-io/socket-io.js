
let mongooseRoom = require('../mongoose/rooms');
let googlemaps = require('../googlemaps/googlemaps');

exports.start = (server) => {
    /* Starts socket.io to be listening on the specific server */
    let io = require('socket.io').listen(server);

    /* Listens for 'connection' messages
     * 'connection' messages are issues by front-end socket-io.js via the
     * io.connect() command */
    io.on('connection', function(socket) {
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

        socket.on('location', (data) => {
            console.log('Location is being updated');
            findUserViaRoom(socket, data, function() {
                broadcastSubmit(socket);
            });
        });

        socket.on('search', (data) => {
            findRoomNoSave(socket.room, function(room) {
                /* Hardcode types in */
                room.types = ['Art Gallery', 'Museum', 'Cafe'];

                console.log('INVOKE GOOGLE MAPS');

                /* Call googleAPI */
                googlemaps.temporaryFunction(room, function(results) {
                    console.log('GOOGLEMAPS RESULT:');

                    console.log(results);

                    // room.results = results;

                    broadcastSubmit(socket);
                });
            });
            // findUserViaRoom(socket, data, broadcastSubmit);
        });

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

    function saveRoom(room) {
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

    function addUser(room, user, cb) {
        /* Credits for random color generator:
         *  https://gist.github.com/samuelbeek/84721c03607ed5340f53
         *  */
        user.color = '#' + (Math.random() * 0xFFFFFF << 0).toString(16);

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

    function broadcastSubmit(socket) {
        let findPromise = mongooseRoom.find({'id': socket.room});
        findPromise
            .then(function(room) {
                console.log('Found the relevant room');

                console.log(room);

                /* Broadcast the found room to the channel with an update */
                io.in(socket.room).emit('update', room);
            })
            .catch(function(err) {
                console.log('No element in the database meets the search criteria');
            });
    }
};