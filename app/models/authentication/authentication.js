const userDB = require('../mongoose/user');
const bodyParser = require('body-parser');
const bcyrpt = require('bcryptjs');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const expressValidator = require('express-validator');
const session = require('express-session');

const saltRounds = 10;

/* set up the passport */
passport.use(new LocalStrategy(
    (username, password, done) => {
        /* get the user using username */
        /* get the user hash */
        let promisedUser = userDB.find({username: username});
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
                return done(null, false);
            });
    }
));

passport.serializeUser((user, done) => {
    done(null, user.username);
});

passport.deserializeUser((username, done) => {
    let promisedUser = userDB.find({username: username});
    promisedUser
        .then((user) => {
            done(null, user);
        })
        .catch((err) => {
            console.log('No element in the database meets the search criteria');
            done(err, null);
        });
});

/* Setup express to enable login session.
 * The callback function should only have paramenter app (configed express)
 */
exports.setup = (app, callback) => {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(expressValidator({
        errorFormatter: function(param, msg, value) {
            let namespace = param.split('.');
            let formParam = namespace.shift();

            while (namespace.length) {
                formParam += '[' + namespace.shift() + ']';
            }
            return {
                param: formParam,
                msg: msg,
                value: value,
            };
        },
        customValidators: {
            isUnique: function(username) {
                return new Promise((resolve, reject) => {
                    let findPromise = userDB.find({username: username});
                    findPromise
                        .then(function(user) {
                            reject();
                        })
                        .catch(function(err) {
                            resolve();
                        });
                });
            },
        },
    }));
    app.use(session({
        secret: 'secrettobechanged',
        saveUninitialized: true,
        resave: true,
    }));
    app.use(passport.initialize());
    app.use(passport.session());

    callback(app);
};

exports.addUserToDb = (req, res) => {
    bcyrpt.hash(req.body.password, saltRounds, (err, hash) => {
        let user = userDB.createNewUser(req.body.name, req.body.email, hash, req.body.username);
        let savePromise = userDB.saveUser(user);
        savePromise
            .then(function(user) {
                /* return success */
                res.status(200).end();
            })
            .catch(function(err) {
                res.status(401).send([{param: 'username', msg: 'username is not unique', value: undefined}]);
            });
    });
};

exports.failToValidateUser = (errors, req, res) => {
    res.status(401).send(JSON.stringify(errors));
};

/* Checks the registration fields
 */
exports.checkRegisterFields = (req, res, successCallback, failCallback) => {
    req.checkBody('name', 'name is required').notEmpty();
    req.checkBody('email', 'email is required').notEmpty();
    req.checkBody('email', 'email is not valid').isEmail();
    req.checkBody('username', 'username is required').notEmpty();
    req.checkBody('username', 'username is not unique').isUnique();
    req.checkBody('password', 'password is required').notEmpty();
    req.checkBody('password2', 'passwords does not match').equals(req.body.password);
    req.asyncValidationErrors()
        .then(function() {
            successCallback(req, res);
        })
        .catch(function(errors) {
            failCallback(errors, req, res);
        });
};

/* example
 *  router.get('/users/home', authentication.ensureAuthenticated, (req, res)=> {
 *      res.status(200).end();
 *  });
 */
/* Pass this function inside router.get to redirect the user to login screen
 * if they are not logged in already
 */
exports.ensureAuthenticated = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return next();
    }
};

exports.passport = passport;
