/* Routing for index.html file */

const express = require('express');
const path = require('path');
const googlemaps = require('../models/googlemaps/googlemaps');
const router = new express.Router();

router.get('/users/index', (req, res)=> {
    res.send(JSON.stringify({'url': '/home'}));
});

/* Post handler for /googlemaps */
router.post('/googlemaps', function(req, res) {
    console.log('[index.html] : POST request to /googlemaps');

    /* Use above included bodyParser to parse incoming JSON
     * Parsing is done via the req.body */
    googlemaps.searchAroundLocation(req.body, function(result) {
        /* The following line could be needed to specify that JSONs will be sent back via the connection */
        // res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(result));
    });
});

/* DEFAULT ROUTING
 * Leave at end of index.js */
router.get('*', (req, res)=> {
    res.sendFile(path.join(__dirname + '/../views/index.html'));
});

module.exports = router;
