const crypto = require('crypto');

const bcrypt = require('bcryptjs'); // import module for password encryption
const nodemailer = require('nodemailer'); // import nodemailer package
const sendgridTransport = require('nodemailer-sendgrid-transport');
const User = require('../models/user'); // import mongoose model
// import method from express-validator
// validationResult give us bunch of results stored by that check() method in router
const { validationResult } = require('express-validator/check');

const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: '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'
    }
}));

// get Login action
exports.getLogin = (req, res, next) => {
    const errorMessage = req.flash('error');
    const successMessage = req.flash('success');

    res.render('auth/login', {
        docTitle: 'Login',
        path: '/login',
        errorMessage: errorMessage,
        successMessage: successMessage,
        oldInput: {
            email: "",
            password: "",
            confirmPassword: ""
        },
        validationErrors: [],
        validationSuccess: {
            email: '',
            password: '',
        }
    });
}

// get Signup action
exports.getSignup = (req, res, next) => {
    const message = req.flash('error');
    res.render('auth/signup', {
        docTitle: 'Signup',
        path: '/signup',
        errorMessage: message,
        oldInput: {
            email: "",
            password: "",
            confirmPassword: ""
        },
        validationErrors: [],
        validationSuccess: {
            email: '',
            password: '',
            confirmPassword: '',
        }
    });
}

// post Login action
exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const successMessage = req.flash('success');
    // form inputs validation module
    const errors = validationResult(req);
    const successEmail = errors.array().find(field => field.param === 'email') ? '' : 'email';
    const successPassword = errors.array().find(field => field.param === 'password') ? '' : 'password';
    // console.log(errors.array());
    // isEmpty() another method that checks errors object and return true or false
    if (!errors.isEmpty()) { // if there were any errors
        // return all errors into array and log
        // console.log(errors.array());
        // set status 422(common status code for validation fail)
        return res.status(422).render('auth/login', {
            docTitle: 'Login',
            path: '/login',
            errorMessage: errors.array()[0].msg,
            successMessage: successMessage,
            oldInput: {
                email: email,
                password: password
            },
            validationErrors: errors.array(),
            validationSuccess: {
                email: successEmail,
                password: successPassword
            }
        });
    }

    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                return res.status(422).render('auth/login', {
                    docTitle: 'Login',
                    path: '/login',
                    errorMessage: 'No account with this e-mail was found!',
                    successMessage: successMessage,
                    oldInput: {
                        email: email,
                        password: password
                    },
                    validationErrors: [{ param: 'email' }],
                    validationSuccess: {
                        email: '',
                        password: ''
                    }
                });
            }
            // .compare() is a method provided by bcryptjs
            // it takes 2 arguments and compare if they are equal or not
            // first is a tiny string
            // second is a hashed string
            // .compare() also can return a promise
            // .campare() catches error only if something went wrong
            // .compare() result is a boolean value
            return bcrypt
                .compare(password, user.password)
                .then(result => {
                    if (result) {
                        // add new param to the session object
                        // this will add new session cookie to the request
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save(err => {
                            console.log(err);
                            res.redirect('/');
                        });
                    }
                    return res.status(422).render('auth/login', {
                        docTitle: 'Login',
                        path: '/login',
                        errorMessage: 'Please enter correct password',
                        successMessage: successMessage,
                        oldInput: {
                            email: email,
                            password: password
                        },
                        validationErrors: [{ param: 'password' }],
                        validationSuccess: {
                            email: 'email',
                            password: ''
                        }
                    });
                })
                .catch(err => {
                    console.log(err);
                    res.redirect('/login');
                })
        })
        .catch(err => {
            // go to error handling middleware
            // const error = new Error(err);
            // error.httpStatusCode = 500;
            // error.errmsg = err.errmsg;
            return next(new Error(err));
        });
}

// post Signup action
exports.postSignup = (req, res, next) => {
    // get input values
    const email = req.body.email;
    const password = req.body.password;

    // form inputs validation module
    const errors = validationResult(req);
    const successEmail = errors.array().find(field => field.param === 'email') ? '' : 'email';
    const successPassword = errors.array().find(field => field.param === 'password') ? '' : 'password';
    const successConfirmPassword = errors.array().find(field => field.param === 'confirmPassword') ? '' : 'confirmPassword';
    // isEmpty() another method that checks errors object and return true or false
    if (!errors.isEmpty()) { // if there were any errors
        // return all errors into array and log
        // console.log(errors.array());
        // set status 422(common status code for validation fail)
        return res.status(422).render('auth/signup', {
            docTitle: 'Signup',
            path: '/signup',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password,
                confirmPassword: req.body.confirmPassword
            },
            validationErrors: errors.array(),
            validationSuccess: {
                email: successEmail,
                password: successPassword,
                confirmPassword: successConfirmPassword,
            }
        });
    }
    // data validation module
    // .hash() is a method provided by bcryptjs
    // it takes 2 arguments a string(your password) as a first value
    // and salt(number of rounds of hashing) as a second value
    // the higher the second value the higher secure will be provided
    // .hash() is async code so it can return a promise
    bcrypt
        .hash(password, 12)
        .then(hashedPassword => {
            const user = new User({
                email: email,
                password: hashedPassword,
                cart: {
                    items: []
                }
            })
            // store values into DB and redirect
            return user.save();
        })
        .then(result => {
            req.flash('success', 'Register successfully')
            res.redirect('/login');
            return transporter.sendMail({
                to: email,
                from: 'nodejs@shop-application.com',
                subject: 'Signup succeeded!',
                html: '<h1>You successfully signed up at nodejs-shop-app !</h1>'
            })
        })
        .catch(err => {
            // go to error handling middleware
            // const error = new Error(err);
            // error.httpStatusCode = 500;
            // error.errmsg = err.errmsg;
            return next(new Error(err));
        });
}

// post Login action
exports.postLogout = (req, res, next) => {
    // .destroy() method provided by session package
    req.session.destroy(err => {
        console.log(err);
        res.redirect('/');
    })
}

// get Reset action
exports.getReset = (req, res, next) => {
    const message = req.flash('error');
    res.render('auth/reset', {
        docTitle: 'Reset Password',
        path: '/reset',
        errorMessage: message
    });
}

// post Reset action
exports.postReset = (req, res, next) => {
    // const message = req.flash('error'); 
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            req.flash('error', 'crypto function error');
            return res.redirect('/reset');
        }
        // buffer contents hex value so need transfrom it to ascii
        // that is why 'hex' filter should be used
        const token = buffer.toString('hex'); // if no error occurs set token
        User.findOne({ email: req.body.email })
            .then(user => {
                if (!user) {
                    req.flash('error', 'No account with that e-mail found');
                    return res.redirect('/reset');
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save();
            })
            .then(result => {
                req.flash('success', 'check you e-mail for password reset link');
                res.redirect('/');
                return transporter.sendMail({
                    to: req.body.email,
                    from: 'nodejs@shop-application.com',
                    subject: 'Password reset!',
                    html: `
                        <h1>You requested password reset!</h1>
                        <h3>If this is truth:</h3>
                        <p>Follow this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password</p>
                        <h3>Otherwise:</h3>
                        <p>Don't do anything to keep your old password</p>
                    `
                })
            })
            .catch(err => {
                // go to error handling middleware
                // const error = new Error(err);
                // error.httpStatusCode = 500;
                // error.errmsg = err.errmsg;
                return next(new Error(err));
            });
    })
}

exports.getUpdatePassword = (req, res, next) => {
    const token = req.params.token;
    // {$gt: Date.now()} special syntax for: 
    // check if resetTokenExpiration value is greater then now
    User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
        .then(user => {
            // const message = req.flash('error');
            res.render('auth/new-password', {
                docTitle: 'Update Password',
                path: '/new-password',
                userId: user._id.toString(),
                passwordToken: token,
                errorMessage: message
            });
        })
        .catch(err => {
            // go to error handling middleware
            // const error = new Error(err);
            // error.httpStatusCode = 500;
            // error.errmsg = err.errmsg;
            return next(new Error(err));
        });
}

exports.postUpdatedPassword = (req, res, next) => {
    const updatedPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;

    User.findOne({
        resetToken: passwordToken,
        resetTokenExpiration: { $gt: Date.now() },
        _id: userId
    })
        .then(user => {
            resetUser = user;
            return bcrypt.hash(updatedPassword, 12);
        })
        .then(hashedPassword => {
            resetUser.password = hashedPassword;
            resetUser.resetToken = undefined;
            resetUser.resetTokenExpiration = undefined;
            return resetUser.save();
        })
        .then(result => {
            req.flash('success', 'password updated successfully');
            res.redirect('/login');
        })
        .catch(err => {
            // go to error handling middleware
            // const error = new Error(err);
            // error.httpStatusCode = 500;
            // error.errmsg = err.errmsg;
            return next(new Error(err));
        });
}