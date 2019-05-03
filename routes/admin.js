const express = require('express'); // import express
const adminController = require('../controllers/admin'); // import controller
const router = express.Router(); // create router object
const isAuth = require('../middleware/is-auth'); // import middleware route protection
const { body } = require('express-validator/check'); // import validation check module

// /admin/add-product => GET reference to the controller
router.get('/add-product', isAuth, adminController.getAddProduct);

// /admin/products => GET reference to the controller
router.get('/products', isAuth, adminController.getProducts);

// /admin/add-product => POST reference to the controller
// for real URLs imageUrl check should look like this
// body('imageUrl')
//     .isURL()

router.post(
    '/add-product',
    [
        body('title', 'Please enter a product title')
            .isString()
            .isLength({ min: 3 })
            .trim(),
        body('price', 'Please set up a price')
            .isFloat(),
        body('description', 'Product description is invalid')
            .isLength({ min: 5, max: 400 })
            .trim()
    ],
    isAuth,
    adminController.postAddProduct);

// /admin/edit-product/:productId => POST reference to the controller
// :productId is a dynamic indicated segment
router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

// /admin/edit-product => POST reference to the controller
router.post(
    '/edit-product',
    [
        body('title')
            .isString()
            .isLength({ min: 3 })
            .trim(),
        body('price')
            .isFloat(),
        body('description')
            .isLength({ min: 5, max: 400 })
            .trim()
    ],
    isAuth,
    adminController.postEditProduct);

// /admin/delete-product => POST reference to the controller
// router.post('/delete-product', isAuth, adminController.postDeleteProduct);
router.delete('/products/product/:productId', isAuth, adminController.deleteProduct);

module.exports = router; // export router object