/* Routing for login.html file */

const express = require('express');
const router = new express.Router();
const passport = require('passport');

router.get('/login', (req, res) => {

});

/* Handle post requests on /users/login
 * Explicitally handles form submission for login credentials */
router.post('/users/login',
    passport.authenticate('local', {failureRedirect: '/users/login'}), (req, res) => {
        res.send(JSON.stringify({'url': '/'}));
    });

module.exports = router;