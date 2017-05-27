var exports = module.exports = {};
const userDB = require('../mongoose/user');
const bodyParser = require('body-parser');
const bcyrpt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const saltRounds = 10;

/* set up the passport */
passport.use(new LocalStrategy(
    (username, password, done) => {
        /* get the user using username */
        /* get the user hash */
        let promisedUser = userDB.find({ username: username });
        promisedUser
            .then((user) => {
                bcyrpt.compare(password, user.password, (err, isMatch) => {
                    if (isMatch) {
                        return done(null, user);
                    } else {
                        return done(null, false);
                    }
                });
            })
            .catch((err) => {
                console.log('No element in the database meets the search criteria');
            });
    }
));

passport.serializeUser((user, done) => {
    done(null, user.username);
});

passport.deserializeUser((username, done) => {
    let promisedUser = userDB.find({ username: username });
    promisedUser
        .then((user) => {
            done(null, user);
        })
        .catch((err) => {
            console.log('No element in the database meets the search criteria');
            done(err, null);
        });
});

/* set up the passport */
/* Checks the registration fields
 * Param: req from post method
 *        callback function should accept boolean 
 */
exports.checkRegisterFields = (req, callback) => {
    req.checkBody('name', 'name is required').notEmpty();
    req.checkBody('email', 'email is required').notEmpty();
    req.checkBody('email', 'email is not valid').isEmail();
    req.checkBody('username', 'username is required').notEmpty();
    req.checkBody('password', 'password is required').notEmpty();
    req.checkBody('password2', 'passwords does not match').equals(req.body.password);
    callback(req.validationErrors());
};

exports.addUser= (req, res) => {
    bcyrpt.hash(req.body.password, saltRounds, (err, hash) => {
        if (err) {
            console.log('failed to create hashed password!');
            throw (err);
        } else {
            console.log('hashed password' + hash);
            let user = userDB.createNewUser(req.body.name, req.body.email, hash, req.body.username);
            userDB.saveUser(user);
            /* redirect to the index page */
            res.render('index');
        }
    });
};

exports.ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  /* force the user to login before accessing this page */
  res.redirect('/users/login');
};


exports.passport = passport;