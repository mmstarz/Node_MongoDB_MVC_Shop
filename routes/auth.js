const express = require('express'); // import express
// import express validator sub package
// expressValidator basically is an object
// we can use next gen JS destructuring feature to extract check() function
// check() is a fucntion that will return a middleware in the end
// now we can add it to the post routes
const { check, body } = require('express-validator/check');
const router = express.Router(); // create router object
const authController = require('../controllers/auth'); // import controller
const User = require('../models/user'); // import user model

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post(
    '/login',
    [
        body('email')
            .isEmail()
            .withMessage('Please enter a valid e-mail address')
            .normalizeEmail(),
        body('password', 'Please enter a valid password')
            .isLength({min: 4, max: 12})
            .isAlphanumeric()
    ],
    authController.postLogin);
// add check() as middleware for validation
// and pass a field name(template>form>input field>name) or array of field names
// that we want to check
// .custom() waits for true or false, or a promise return
// Promise.reject() - creates new error message

router.post(
    '/signup',
    [
        check('email')
            .isEmail()
            .withMessage('Please enter a valid e-mail')
            .custom((value, { req }) => {
                return User.findOne({ email: value })
                    .then(userDocument => {
                        if (userDocument) {
                            return Promise.reject('This e-mail already taken');
                        }
                    })
            })
            .normalizeEmail(),
        body(
            'password',
            'Please enter a valid password with only numbers and text (from 5 to 12 characters length)'
        )
            .isLength({ min: 4, max: 12 })
            .isAlphanumeric()
            .trim(),
        body('confirmPassword')
            .trim()
            .custom((value, { req }) => {
                if (value === req.body.password) {
                    return true;
                }
                throw new Error(`Passwords doesn't match`);
            })
    ],
    authController.postSignup
);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getUpdatePassword);

router.post('/new-password', authController.postUpdatedPassword);

module.exports = router; // export router object