const authentication = require('../authentication/authentication');
const express = require('express');
const router = express.Router();

router.get('/register', (req, res) => {
    res.render('register');
});

router.post('/register', (req, res) => {
   authentication.checkRegisterFields(req, (error) => {
        if (error) {
            /* TODO send the error message down */
            console.log('Failed to create a new user');
            res.render('register');
        } else {
            /* TODO send confirmation email */
            console.log('creating the new user' + req.body.password);
            authentication.addUser(req, res);
        }
    });
});

router.get('/login', (req, res) => {
    res.render('login');
});

router.post('/login',
    authentication.passport.authenticate('local', { failureRedirect: '/users/login' }),
    (req, res) => {
        res.redirect('/');
    }
);

module.exports = router;