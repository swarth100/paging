const express = require('express');
const authentication = require('./app/models/authentication/authentication');
const indexRoute = require('./app/routes/index');
const loginRoute = require('./app/routes/login');
const homeRoute = require('./app/routes/home');
const appRoute = require('./app/routes/app');
const registerRoute = require('./app/routes/register');
const path = require('path');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');

/* Defines the application */
let app = express();

/* Basic authentication for users */
authentication.setup(app, (app) => {
    /* Body Parser for JSON format variables
     * Access the variable via the *.body field */
    app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.json());
    app.use(expressValidator());

    /* Set the URI here */
    app.use(express.static(path.join(__dirname, '/app/views')));
    app.use(indexRoute);
    app.use(loginRoute);
    app.use(registerRoute);
    app.use(homeRoute);
    app.use(appRoute);

    /* Sets the server to port 3000.
     * Openes port 3000 to listen for connections */
    app.set('port', (3000));
    app.listen(app.get('port'), () => {
        console.log('[Server] : open on port ' + app.get('port'));
    });
});

module.exports = app;
