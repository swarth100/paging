const userDB = require('../mongoose/user');
const bodyParser = require('body-parser');
const express = require('express');
const router = express.Router();

router.get('/register', (req, res)=> {
    res.render('register');
});

router.post('/register', (req, res)=> {
	let username = req.body.username;
	let name = req.body.name;
	let email = req.body.email;
	let password = req.body.password;
	let password2 = req.body.password2;

	req.checkBody('name', 'name is required').notEmpty();
	req.checkBody('email', 'email is required').notEmpty();
	req.checkBody('email', 'email is not valid').isEmail();
	req.checkBody('username', 'username is required').notEmpty();
	req.checkBody('password', 'password is required').notEmpty();
	req.checkBody('password2', 'passwords do not match').equals(req.body.password);

    let error = req.validationErrors();
	if (error) {
		/* TODO send the error message down */
		console.log('failed creating the new user');
		res.render('register');
	} else {
		/* TODO hash the password, send confirmation email */
		console.log('creating the new user');
		userDB.createNewUser(name, email, password);
		res.render('index')
	}
});

router.get('/login', (req, res)=> {
    res.render('login');
});

module.exports = router;