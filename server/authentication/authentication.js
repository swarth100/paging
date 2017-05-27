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
    let error = req.validationErrors();
    callback(error);
};

exports.passport = passport;