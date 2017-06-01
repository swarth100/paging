/* Routing for home.html file */

const express = require('express');
const authentication = require('../models/authentication/authentication.js');
const router = new express.Router();

router.get('/users/search', (req, res)=> {
    res.send(JSON.stringify({'url': '/app'}));
});

router.get('/users/home', authentication.ensureAuthenticated, (req, res)=> {
    res.send(JSON.stringify({'url': '/login'}));
});

module.exports = router;