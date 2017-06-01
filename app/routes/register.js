/* */

const express = require('express');
const passport = require('../models/authentication/authentication.js');
const router = new express.Router();

/* Handle post requests on /users/register
 * Explicitally handles form submission for register credentials */
router.post('/users/register', (req, res) => {
    passport.checkRegisterFields((error) => {
        if (error) {
            /* TODO send the error message down */
            console.log('[Auth] user creation : failure');
            console.log(error);

            res.writeHead(401, {'Content-Type': 'application/json'});
            return res.end();
        } else {
            /* TODO send confirmation email */
            console.log('[Auth] user creation : success');
            passport.addUser(req, res);
        }
    });
});

module.exports = router;