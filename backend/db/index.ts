import mongoose from "mongoose";

const sellerSchema = new mongoose.Schema({
    username: String,
    password: String,
    address: String,
    itemId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SellingItemList' // Reference to the RelatedModel collection
    }],
    firstName: String,
    lastName: String,
});


const buyerSchema = new mongoose.Schema({
    username: String,
    password: String,
    address: String,
    bag: [{
        itemId: mongoose.Schema.Types.ObjectId,
        quantity: Number,
    }],
    firstName: String,
    lastName: String,
});

const SellingItemListSchema = new mongoose.Schema({
    name: String,
    description: String,
    imageLink: String,
    quantityAvailable: Number,
    minSellingQuantity: Number,
    pricePerUnit: Number,
    location: String,
});





export const Seller = mongoose.model('Seller', sellerSchema);
export const SellingItemList = mongoose.model('SellingItemList', SellingItemListSchema);
export const Buyer = mongoose.model('Buyer', buyerSchema);
