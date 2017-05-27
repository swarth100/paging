const userDB = require('../mongoose/user');
const bodyParser = require('body-parser');
const express = require('express');
const bcyrpt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const router = express.Router();

const saltRounds = 10;

/* set up the passport */
passport.use(new LocalStrategy(
    (username, password, done) => {
        /* get the user using username */
        /* get the user hash */
        let user = 'user';
        let hash = 'hash';
        bcrypt.compare(password, hash, (err, isMatch) => {
            if (err) {
                throw err;
            }
            if (isMatch) {
                return done(null, user);
            }
            return done(null, false);
        });
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    /* find user */
    // User.getUserById(id, function(err, user) {
    //   done(err, user);
    // });
});


router.get('/register', (req, res) => {
    res.render('register');
});

router.post('/register', (req, res) => {
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
        res.render('register');
    } else {
        /* TODO send confirmation email */
        console.log('creating the new user');
        bcyrpt.hash(req.body.password, saltRounds, (err, hash) => {
            if (err) {
                console.log('failed to create hashed password!');
                throw (err);
            } else {
                console.log(hash);
                let user = userDB.createNewUser(req.body.name, req.body.email, hash, req.body.username).saveUser();
                /* redirect to the index page */
                res.render('index');
            }
        });
    }
});

router.get('/login', (req, res) => {
    res.render('login');
});

router.post('/login',
    passport.authenticate('local', { failureRedirect: '/users/login' }),
    (req, res) => {
        res.redirect('/');
    }
);

module.exports = router;