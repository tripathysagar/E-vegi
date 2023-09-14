import mongoose from "mongoose";
import { boolean } from "webidl-conversions";
import { string } from "zod";

const sellerSchema = new mongoose.Schema({
    username: String,
    password: String,
    address: String,
    itemId: [{
        type: mongoose.Types.ObjectId,
        ref: 'SellingItemList' // Reference to the RelatedModel collection
    }],
    firstName: String,
    lastName: String,
});


const buyerSchema = new mongoose.Schema({
    username: String,
    password: String,
    bagId: mongoose.Types.ObjectId,
    firstName: String,
    lastName: String,
    location: String,
});

const sellingItemListSchema = new mongoose.Schema({
    name: String,
    description: String,
    imageLink: String,
    quantityAvailable: Number,
    minSellingQuantity: Number,
    pricePerUnit: Number,
    location: String,
    dateAdded: Number
});


const bagSchema = new mongoose.Schema({
    isActive: Boolean,
    buyerId: {
        type: mongoose.Types.ObjectId,
        quantity: Number,
    },
    items: [
        {
        itemId:{
            type: mongoose.Types.ObjectId,
            ref: 'SellingItemList'
        },
        quantity: Number,
        isPresent: Boolean,
        price: Number
    }]
});


const orderSchema =  new mongoose.Schema({ 
    buyerId: {
        type: mongoose.Types.ObjectId,
        ref: 'Buyer'
    },
    bagId: {
        type: mongoose.Types.ObjectId,
        ref: 'Bag'
    },
    paymentStatus: String,
    packageStatus: String,
})


export const Seller = mongoose.model('Seller', sellerSchema);
export const SellingItemList = mongoose.model('SellingItemList', sellingItemListSchema);
export const Buyer = mongoose.model('Buyer', buyerSchema);
export const Bag = mongoose.model('Bag', bagSchema);
export const Order = mongoose.model('Order', orderSchema);



