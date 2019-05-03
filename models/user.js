const mongoose = require('mongoose'); // import mongoose lib

const Schema = mongoose.Schema; // define mongoose schema constructor

const userSchema = new Schema({    
    email: { type: String, required: true },
    password: {type: String, required: true},
    resetToken: String,
    resetTokenExpiration: Date,
    cart: {
        items: [
            {
                productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
                quantity: { type: Number, required: true }
            }
        ]
    }
})

// mongoose have special methods field for your own static methods
// this. will retreive to this current schema
userSchema.methods.addToCart = function (product) {
    // get index if this product exist in the cart
    const cartProductIndex = this.cart.items.findIndex(item => {
        // return an index of the item in the cart if it exist
        return item.productId.toString() === product._id.toString();
    });

    let newQuantity = 1;
    const updatedCartItems = [...this.cart.items];
    if (cartProductIndex >= 0) {
        newQuantity = this.cart.items[cartProductIndex].quantity + 1;
        updatedCartItems[cartProductIndex].quantity = newQuantity;
    } else {
        updatedCartItems.push({
            productId: product._id,
            quantity: newQuantity
        })
    }
    // creates an object which holds upatedCartItems array
    const updatedCart = {
        items: updatedCartItems
    };
    // change cart value to updated cart
    this.cart = updatedCart;
    return this.save();
}

userSchema.methods.removeItemFromCart = function (productId) {
    // assign veriable for updated cart items
    const updatedCartItems = this.cart.items.filter(item => {
        return item.productId.toString() !== productId.toString()
    });
    this.cart.items = updatedCartItems;
    return this.save();
}

userSchema.methods.clearCart = function () {
    this.cart = { items: [] };
    return this.save();
}

module.exports = mongoose.model('User', userSchema);