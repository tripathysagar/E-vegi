import mongoose from "mongoose";

const sellerSchema = new mongoose.Schema({
    username: String,
    password: String,
    address: String,
    itemId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SellingList' // Reference to the RelatedModel collection
      }]
});


const sellingList = new mongoose.Schema({
    dateAdded: Date,
    name: String,
    description: String,
    imageLink: String,
    quantityAvailable: String,
    minSellingUnit: String,
    pricePerUnit: Number,
    location: String,
});



export const Seller = mongoose.model('Seller', sellerSchema);
export const SellingList = mongoose.model('SellingList', sellerSchema);

