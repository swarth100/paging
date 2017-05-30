/* */

const userDB = require('../models/mongoose/user.js');
const express = require('express');
const bcyrpt = require('bcrypt');
const passport = require('../models/authentication/authentication.js');
const router = new express.Router();

const saltRounds = 10;

router.get('/register', (req, res) => {

});

/* Handle post requests on /users/register
 * Explicitally handles form submission for register credentials */
router.post('/users/register', (req, res) => {
    req.checkBody('name', 'name is required').notEmpty();
    req.checkBody('email', 'email is required').notEmpty();
    req.checkBody('email', 'email is not valid').isEmail();
    req.checkBody('username', 'username is required').notEmpty();
    req.checkBody('password', 'password is required').notEmpty();
    req.checkBody('password2', 'passwords does not match').equals(req.body.password);

    let error = req.validationErrors();
    if (error) {
        /* TODO send the error message down */
        console.log('Failed to create a new user');
        console.log(error);
        res.send(JSON.stringify({'url': '/register'}));
    } else {
        /* TODO send confirmation email */
        console.log('creating the new user');
        passport.addUser(req, res);
    }
});

module.exports = router;