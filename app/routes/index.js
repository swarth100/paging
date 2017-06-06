/* Routing for index.html file */

const express = require('express');
const path = require('path');
const googlemaps = require('../models/googlemaps/googlemaps');
const router = new express.Router();

/* DEFAULT ROUTING
 * Leave at end of index.js */
router.get('/*', (req, res)=> {
    res.sendFile(path.join(__dirname + '/../views/index.html'));
});

module.exports = router;
