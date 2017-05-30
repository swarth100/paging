const express = require('express');
const authentication = require('./app/models/authentication/authentication');
const routes = require('./app/routes/index');
const path = require('path');
const bodyParser = require('body-parser');

/* Defines the application */
let app = express();

/* Body Parser for JSON format variables
 * Access the variable via the *.body field */
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

/* Set the URI here */
app.use(express.static(path.join(__dirname, '/app/views')));
app.use(routes);

/* Sets the server to port 3000.
 * Openes port 3000 to listen for connections */
app.set('port', (3000));
app.listen(app.get('port'), () => {
    console.log('[Server] : open on port ' + app.get('port'));
});

/* Basic authentication for users */
authentication.setup(app, (app) => {

});
