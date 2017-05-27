const express = require('express');
const router = express.Router();

let ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/users/login');
}


router.get('/', ensureAuthenticated, (req, res)=> {
    res.render('index');
});

module.exports = router;