const express = require('express');
const router = new express.Router();
const passport = require('passport');
const friends = require('./../models/friendlist/friendlist');

/* Handle post requests on /users/login
 * Explicitally handles form submission for login credentials */
router.post('/users/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            console.log('no user found');
            return res.status(401).end();
        }
        req.logIn(user, (err) => {
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
router.get('/users/logout', (req, res) => {
  req.session.destroy((err) => {
       return res.status(200).end();
    });
});

/* Handle post requests on /users/register
 * Explicitally handles form submission for register credentials */
router.post('/users/register', (req, res) => {
    passport.checkRegisterFields(req, res, passport.addUserToDb, passport.failToValidateUser);
});

/* Handles get request on /users/friends
 * Returns the usernames of the friends */
router.get('/users/friends', (req, res) => {
    console.log(req.user);
   if (req.isAuthenticated()) {
        friends.getFriendUsernames(req.user.username, (friendUsernames) => {
            res.status(200).send(friendUsernames);
        });
    } else {
        /* The user is not logged in, status code for Forbidden */
       res.status(403).end();
    }
});

module.exports = router;