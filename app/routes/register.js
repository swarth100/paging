/* */

const express = require('express');
const passport = require('../models/authentication/authentication.js');
const router = new express.Router();

/* Handle post requests on /users/register
 * Explicitally handles form submission for register credentials */
router.post('/users/register', (req, res) => {
    passport.checkRegisterFields(req, res, passport.addUserToDb, passport.failToValidateUser);
});

module.exports = router;