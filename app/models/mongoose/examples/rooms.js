let mongooseRoom = require('./app/models/mongoose/rooms');

/* Create a new location */
let room = mongooseRoom.createNewRoom('roomIDandName');

/* Print the fields of the newly created location */
console.log(room.id);


/* ------------------------------------------------------------------------------------------------------------------ */
/* location.js -- mongooseLocation.saveLocation */

/* Save the location to the database */
let savePromise = mongooseRoom.saveRoom(room);
savePromise
    .then(function(room) {
        console.log('Saved with success.');
    })
    .catch(function(err) {
        console.log('Error occurred while saving to the database');
    });

/* Retrieve 1 location from the database */
 let findPromise = mongooseRoom.find({});
 findPromise
     .then(function(room) {
         console.log('Found it yes');
         console.log(room);
     })
     .catch(function(err) {
        console.log('No element in the database meets the search criteria');
     });


 /* NOTE: DEPRECATED ARGUMENTS */
 let updatePromise = mongooseRoom.updateUser(room, 'rose', 4200, 3100);
 updatePromise
     .then(function(room) {
        console.log(room);
     })
     .catch(function(err) {
         console.log('No element in the database meets the search criteria');
     });

/* NOTE: DEPRECATED ARGUMENTS */
 let addPromise = mongooseRoom.addUser(room, 'rose', 4200, 3100);
 addPromise
     .then(function(room) {
         console.log(room);
     })
     .catch(function(err) {
         console.log('No element in the database meets the search criteria');
     });

/* NOTE: DEPRECATED ARGUMENTS */
let updateOrSavePromise = mongooseRoom.updateUser(room, 'bob', 1000, 1000);
updateOrSavePromise
    .then(function(room) {
        console.log('Found user, updated values!');
        console.log(room);
    })
    .catch(function(err) {
        console.log(err);
        let addPromise = mongooseRoom.addUser(room, 'bob', 800, 800);
        addPromise
            .then(function(room) {
                console.log('Saved new user with given values');
                console.log(room);
            })
            .catch(function(err) {
                console.log('No element in the database meets the search criteria. Failed');
            });
    });