const express = require('express');
const authentication = require('../authentication/authentication');
const router = express.Router();

router.get('/', authentication.ensureAuthenticated, (req, res)=> {
    res.render('index');
});

module.exports = router;