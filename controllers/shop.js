const fs = require('fs'); // import node file system
const path = require('path'); // import node path module

const Product = require('../models/product'); // import mongoose model
const Order = require('../models/order'); // import mongoose model
const PDFDocument = require('pdfkit'); // import pdfkit module
// const stripe = require("stripe")("sk_test_NAuL84MEMaYfuAtFALF4njTg");
const stripe = require("stripe")(process.env.STRIPE_KEY);
// assign global variable for parination items
const ITEMS_PER_PAGE = +process.env.ITEMS_PER_PAGE;

// get Products action
exports.getProducts = (req, res, next) => {
    // mongoose .find() method don't return a cursor
    // to get a cursor use .find().cursor().eachAsync()
    // or .find().cursor().next()
    // mongoose .find() method return all documents for products collection
    const currUser = req.user;
    // + converts from string to number
    const page = +req.query.page || 1; // if req.query.page undefined use 1
    let totalItems; // total number of products
    // dynamic pagination
    // .countDocuments() simply return a number of the documents in collection
    Product.find()
        .countDocuments()
        .then(numProducts => {
            totalItems = numProducts; // store that information about number of products
            // mongoose .find() method return all documents for products collection
            // simply returns array of products
            return Product
                .find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
        })
        .then(products => { // array of objects
            res.render('shop/product-list', {
                prods: products,
                user: currUser,
                docTitle: 'Products',
                path: '/products',
                pagination: totalItems > ITEMS_PER_PAGE,
                currPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPrevPage: page > 1,
                nextPage: page + 1,
                prevPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
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

// get Single Product action
exports.getSingleProduct = (req, res, next) => {
    // assign variable for a dynamic segment part of a request path
    const productId = req.params.productId;
    // mongoose .findById() method auto convert string into mongodb.ObjectId()    
    Product.findById(productId)
        .then(product => { // return an object
            res.render('shop/product-details', {
                prod: product,
                docTitle: `${product.title} (details)`,
                path: `/products/:${productId}`,
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

// get Index action
exports.getIndex = (req, res, next) => {
    const errorMessage = req.flash('error');
    const successMessage = req.flash('success');
    // + converts from string to number
    const page = +req.query.page || 1; // if req.query.page undefined use 1
    let totalItems; // total number of products
    // dynamic pagination
    // .countDocuments() simply return a number of the documents in collection
    Product.find().countDocuments().then(numProducts => {
            totalItems = numProducts; // store that information about number of products
            // mongoose .find() method return all documents for products collection
            // simply returns array of products
            return Product
                .find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
        })
        .then(products => { // array of objects
            res.render('shop/index', {
                prods: products,
                docTitle: 'Shop',
                path: '/',
                errorMessage: errorMessage,
                successMessage: successMessage,
                pagination: totalItems > ITEMS_PER_PAGE,
                currPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPrevPage: page > 1,
                nextPage: page + 1,
                prevPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
            });
        })
        .catch(err => {
            return next(new Error(err));
        });
}

// get Cart action
exports.getCart = (req, res, next) => {
    const successMessage = req.flash('success');
    const errorMessage = req.flash('error');
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            const products = user.cart.items;
            // console.log(products);
            res.render('shop/cart', {
                docTitle: 'Your Cart',
                path: '/cart',
                prods: products,
                successMessage: successMessage,
                errorMessage: errorMessage

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

// post Cart action
exports.postCart = (req, res, next) => {
    const productId = req.body.productId;
    Product.findById(productId)
        .then(product => {
            return req.user.addToCart(product)
        })
        .then(result => {
            // console.log('PRODUCT ADDED TO CART');
            req.flash('success', 'Product was added to the cart')
            res.redirect('/cart');
        })
        .catch(err => {
            // go to error handling middleware
            // const error = new Error(err);
            // error.httpStatusCode = 500;
            // error.errmsg = err.errmsg;
            return next(new Error(err));
        });
}

// post remove cart item action
exports.postRemoveCartItem = (req, res, next) => {
    const productId = req.body.productId;
    req.user.removeItemFromCart(productId)
        .then(result => {
            // console.log('ITEM REMOVED FROM THE CART')
            req.flash('error', 'Item was removed from the cart');
            res.redirect('/cart');
        })
        .catch(err => {
            // go to error handling middleware
            // const error = new Error(err);
            // error.httpStatusCode = 500;
            // error.errmsg = err.errmsg;
            return next(new Error(err));
        });
}

// get Checkout action
exports.getCheckout = (req, res, next) => {
    const successMessage = req.flash('success');
    const errorMessage = req.flash('error');
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            const products = user.cart.items;
            // console.log(products); // [{}, {}...]
            // calculate total price
            let totalprice = 0;
            products.forEach(p => {
                totalprice += p.quantity * p.productId.price;
            });
            // console.log(products);
            res.render('shop/checkout', {
                docTitle: 'Checkout',
                path: '/checkout',
                successMessage: successMessage,
                errorMessage: errorMessage,
                prods: products,
                totalSum: totalprice
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

// post Order action
exports.postOrder = (req, res, next) => {
    // Set your secret key: remember to change this to your live secret key in production
    // See your keys here: https://dashboard.stripe.com/account/apikeys
    // const stripe = require("stripe")("sk_test_NAuL84MEMaYfuAtFALF4njTg"); // moved to top

    // Token is created using Checkout or Elements!
    // Get the payment token ID submitted by the form:
    const token = req.body.stripeToken; // Using Express
    let totalSum = 0; // assign total sum variable
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            // calculate total sum
            user.cart.items.forEach(item => {
                totalSum += item.productId.price * item.quantity;
            });

            const products = user.cart.items.map(item => {
                return {
                    product: { ...item.productId._doc
                    },
                    quantity: item.quantity
                }
            })
            // create and init new order object
            const order = new Order({
                products: products,
                user: {
                    email: req.user.email,
                    userId: req.user
                }
            });
            return order.save(); // save order to the DB
        })
        .then(result => {
            // initialize stripe object
            // totalsum * 100 bcs of stripe amount format
            // send request to the stripe servers and make them charge
            const charge = stripe.charges.create({
                amount: totalSum * 100,
                currency: 'usd',
                description: 'Demo Order',
                source: token,
                metadata: {
                    order_id: result._id.toString()
                }
            });
            return req.user.clearCart();
        })
        .then(() => {
            // console.log('NEW ORDER ADDED');
            req.flash('success', 'New Order added successfully');
            res.redirect('/orders');
        })
        .catch(err => {
            // go to error handling middleware
            // const error = new Error(err);
            // error.httpStatusCode = 500;
            // error.errmsg = err.errmsg;
            return next(new Error(err));
        });
}

// get Orders action
exports.getOrders = (req, res, next) => {
    const successMessage = req.flash('success');
    // return orders array for current user
    Order.find({
            'user.userId': req.session.user._id
        })
        .then(orders => {
            res.render('shop/orders', {
                docTitle: 'Your Orders',
                path: '/orders',
                orders: orders,
                successMessage: successMessage
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

// get Invoice action
exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;
    Order.findById(orderId)
        .then(order => {
            if (!order) {
                return next(new Error('No order found'));
            }

            if (order.user.userId.toString() !== req.user._id.toString()) {
                return next(new Error('Unauthorized action'));
            }

            const invoiceFileName = 'invoice-' + orderId + '.pdf';
            const invoiceFilePath = path.join('data', 'invoices', invoiceFileName);
            // bonus way pdf generator
            // pdfDocument is a readable stream
            const pdfDocument = new PDFDocument(); // assign new pdfDoc
            // set headers
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader(
                'Content-Disposition',
                'inline; filename="' + invoiceFileName + '"'
            );
            // transform into writable stream
            pdfDocument.pipe(fs.createWriteStream(invoiceFilePath));
            // send to the client browser via response
            pdfDocument.pipe(res);
            // write data line in to pdf file
            pdfDocument.fontSize(26).text('Invoice', {
                underline: true,
            });
            pdfDocument.text('----------------------');
            let totalPrice = 0;
            order.products.forEach(prod => {
                totalPrice += prod.quantity * prod.product.price;
                Math.floor(totalPrice, -2);
                pdfDocument.fontSize(14).text(
                    prod.product.title +
                    ':    ' +
                    prod.quantity +
                    ' x ' +
                    '$' +
                    prod.product.price
                );
            });
            pdfDocument.fontSize(26).text('----------------------');
            pdfDocument.fontSize(16).text('Total Price:              $' + totalPrice.toFixed(2));
            // stop write stream
            pdfDocument.end();
            // one way for tiny files
            // fs.readFile(invoiceFilePath, (err, data) => {
            //     if (err) {
            //         return next(err); // launch error handling function
            //     }
            //     // one way (download file)
            //     // res.download(invoiceFilePath); // works fine
            //     // second way (open in browser)
            //     res.setHeader('Content-Type', 'application/pdf'); // set content type
            //     // 'inline' - opens in browser
            //     // 'attachment; filename="'+ invoiceFileName +'"' - opens download file context menu
            //     res.setHeader('Content-Disposition', 'inline; filename="' + invoiceFileName + '"'); // how to serve this data
            //     res.send(data)
            // })

            // second way for big files
            // create readable stream
            // const file = fs.createReadStream(invoiceFilePath);
            // res.setHeader('Content-Type', 'application/pdf');
            // res.setHeader(
            //     'Content-Disposition',
            //     'inline; filename="' + invoiceFileName + '"'
            // );
            // sends read stream chunks to the response stream
            // response is a writable stream btw.
            // so then buffer will send all chunks to the client browser
            // and browser will concat them together into a full file
            // file.pipe(res);
        })
        .catch(err => {
            return next(new Error(err));
        })
}