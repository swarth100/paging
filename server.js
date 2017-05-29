const express = require('express');
const authentication = require('./app/models/authentication/authentication');
const routes = require('./app/routes/index');

let app = express();

authentication.setup(app, (app) => {
  /* Set the URI here */
  app.use('/', routes);

  /* Set the port here */
  app.set('port', (3000));
  app.listen(app.get('port'), () => {
    console.log('started server on port ' + app.get('port'));
  });
});
