const mongoose = require('mongoose'); // import mongoose

const Schema = mongoose.Schema; // mongoose schema constructor

// define product data schema with help of mongoose schema constructor
const productSchema = new Schema({
    title: {type: String, required: true},
    price: {type: Number, required: true},
    description: {type: String, required: true},
    imageUrl: {type: String, required: true},
    userId: {type: Schema.Types.ObjectId, ref: 'User', required: true},    
    userEmail: { type: String, ref: 'User', required: true },
});

module.exports = mongoose.model('Product', productSchema);