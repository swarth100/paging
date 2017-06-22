require('dotenv').config();
const express = require('express');
const authentication = require('./app/models/authentication/authentication');
const indexRoute = require('./app/routes/index');
const userRoute = require('./app/routes/user');
const homeRoute = require('./app/routes/home');
const appRoute = require('./app/routes/app');
const path = require('path');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const socket = require('./app/models/socket-io/socket-io');
const friends = require('./app/models/friendlist/friendlist');

/* Defines the application */
let app = express();

/* Basic authentication for users */
authentication.setup(app, (app) => {
    /* Body Parser for JSON format variables
     * Access the variable via the *.body field */
    app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.json());

    /* Set the URI here */
    app.use(express.static(path.join(__dirname, '/app/views')));
    app.use(userRoute);
    app.use(homeRoute);
    app.use(appRoute);

    /* Default routing. Keep at the end */
    app.use(indexRoute);

    /* Sets the server to port 3000.
     * Opens port 3000 to listen for connections
     * Otherwise use heroku provided port */
    app.set('port', (process.env.PORT || 3000));
    let server = app.listen(app.get('port'), () => {
        console.log('[Server] : open on port ' + app.get('port'));
    });

    socket.start(server);
});

module.exports = app;
