import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

import {Seller, Buyer, SellingItemList } from "../db/index";

type availableItem = {
    name: string,
    description: string,
    imageLink: string,
    quantityAvailable: Number,
    minSellingQuantity: Number,
    pricePerUnit: Number,
    location: string,
    dateAdded: Number
}

async function fetchItems(itemId : mongoose.Types.ObjectId) {
    return new Promise(async (resolve, reject) => {
      try {
        const item = await SellingItemList.findById(itemId);
  
        if (
            item?._id === undefined ||
            item?.name === undefined ||
            item?.description === undefined ||
            item?.imageLink === undefined ||
            item?.quantityAvailable === undefined ||
            item?.minSellingQuantity === undefined ||
            item?.pricePerUnit === undefined ||
            item?.location === undefined ||
            item?.dateAdded === undefined
          ) {
            console.log("got undefined");
            resolve(0);
          }
        if(item?.quantityAvailable === 0){
            resolve(0)
        }
        const obj = {
          id: item?._id,
          name: item?.name,
          description: item?.description,
          imageLink: item?.imageLink,
          quantityAvailable: item?.quantityAvailable,
          minSellingQuantity: item?.minSellingQuantity,
          pricePerUnit: item?.pricePerUnit,
          location: item?.location,
          dateAdded: item?.dateAdded,
        };
  
        resolve(obj);
      } catch (error) {
        reject(error);
      }
    });
  }
  


export const buyerAvailableItems = async(req: Request, res: Response, next: NextFunction) => {
    const message: any[] = [];
    try{
        await Seller.find({}).then(async (sellers) => {
            for(let i = 0; i < sellers.length; i++){
                const sellerItems : mongoose.Types.ObjectId[] = sellers[i]?.itemId;
                for (const itemId of sellerItems){
                    const data = await fetchItems(itemId);
                    if (data === 0) {
                        console.log("Data is 0, indicating an issue.");
                    } else {
                        //console.log("Data:", data);
                        
                       
                            message.push(data);
                        
                        
                        // Use the 'data' object as needed
                    }
                }
                
            }
            return message;
        })
    } catch(error){
        console.error("Error:", error);
        next(error); 
    }
    
    
    //console.log(message)
    req.body = message;
    next()

    
}
        
        
    


