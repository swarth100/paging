const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
const authentication = require('./server/authentication/authentication');
const routes = require('./server/routes/index');
const users = require('./server/routes/users');

let app = express();

app.set('views', path.join(__dirname, '/server/views'));
app.engine('handlebars', exphbs({
  defaultLayout: 'layout',
  layoutsDir: './server/views/layouts/',
}));
app.set('view engine', 'handlebars');
app.use(express.static(path.join(__dirname, '/server/public')));

authentication.setup(app, (app) => {
  /* Set the URI here */
  app.use('/', routes);
  app.use('/users', users);

  /* Set the port here */
  app.set('port', (3000));
  app.listen(app.get('port'), () => {
    console.log('started server on port ' + app.get('port'));
  });
});
