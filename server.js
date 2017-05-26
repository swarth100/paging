const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
let routes = require('./server/routes/index');
let users = require('./server/routes/users');

let app = express();

app.set('views', path.join(__dirname, '/server/views'));
app.engine('handlebars', exphbs({
  defaultLayout: 'layout',
  layoutsDir: './server/views/layouts/'}));
app.set('view engine', 'handlebars');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, '/server/public')));

app.use(session({
  secret: 'secrettobechanged',
  saveUninitialized: true,
  resave: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
    let namespace = param.split('.');
    let formParam =  namespace.shift();

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

app.use(flash());

app.use((req, res, next)=> {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

/* Set the URI here */
app.use('/', routes);
app.use('/users', users);

/* Set the port here */
app.set('port', (process.env.PORT || 3000));
app.listen(app.get('port'), ()=> {
  console.log('started server on port ' + app.get('port'));
});
