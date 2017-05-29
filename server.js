const express = require('express');
const authentication = require('./app/models/authentication/authentication');
const routes = require('./app/routes/index');
const path = require('path');
const bodyParser = require("body-parser");

let app = express();

authentication.setup(app, (app) => {
  /* Set the URI here */
  app.use(express.static(path.join(__dirname, '/app/views')));
  app.use(routes);

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  /* Set the port here */
  app.set('port', (3000));
  app.listen(app.get('port'), () => {
    console.log('started server on port ' + app.get('port'));
  });
});

app.post('/googlemaps', function(req,res){
    console.log("Post was caught");
    let name=req.body.name;
    console.log("User name = "+name);
    res.end("yes");
});
