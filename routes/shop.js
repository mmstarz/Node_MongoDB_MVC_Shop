const express = require('express'); // import express
const router = express.Router(); // create router object
const shopController = require('../controllers/shop'); // import controller
const isAuth = require('../middleware/is-auth'); // import middleware route protection

// '/' => GET reference to the controller
router.get('/', shopController.getIndex);

// '/products' => GET reference to the controller
router.get('/products', shopController.getProducts);

// : - allows to set a placeholder for future information
// : - signals to express that it shouldn't look for a route
// :productId can be anything and we can than extraxt that information
// :productId is a dynamic segment and the order also matters
// if you will place any routes with same path after dynamic segment
// you'll never reach them

// '/products/id' => GET reference to the controller
router.get('/products/:productId', shopController.getSingleProduct);

// '/cart' => GET reference to the controller
router.get('/cart', isAuth, shopController.getCart);

// '/cart' => POST reference to the controller
router.post('/cart', isAuth, shopController.postCart);

// '/cart-remove-item' => POST reference to the controller
router.post('/cart-remove-item', isAuth, shopController.postRemoveCartItem);

// '/checkout' GET action
router.get('/checkout', isAuth, shopController.getCheckout);

// '/create-order' => POST reference to the controller
// router.post('/create-order', isAuth, shopController.postOrder); // moved to app.js

// '/orders' => GET reference to the controller
router.get('/orders', isAuth, shopController.getOrders);

// '/orders/:orderId' => GET reference to the controller
router.get('/orders/:orderId', isAuth, shopController.getInvoice);

module.exports = router; // export router object