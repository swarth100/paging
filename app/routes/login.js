/* Routing for login.html file */

const express = require('express');
const router = new express.Router();
const passport = require('passport');

/* Handle post requests on /users/login
 * Explicitally handles form submission for login credentials */
router.post('/users/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
            console.log('no user found');
            return res.status(401).end();
        }
        req.logIn(user, function(err) {
            if (err) {
                return next(err);
            }
            console.log('user found');
            return res.status(200).send(user);
        });
    })(req, res, next);
});
/* Handle post requests on /users/signout
 * Destroy's the current session */
router.get('/users/logout', function(req, res) {
   req.session.destroy(function(err) {
       return res.status(200).end();
    });
});


module.exports = router;