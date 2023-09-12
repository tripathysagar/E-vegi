import express from 'express';
import mongoose from "mongoose";
const { ObjectId } = require('mongodb');


import {Seller, Buyer, SellingItemList, Bag } from "../db/index";
import generatePassword from "../utils/generatePassword";
import jwtSign from '../utils/jwtSign';
import {validateJWT} from '../middleware/validateJWT';
import {buyerAvailableItems} from '../middleware/buyerAvailableItems';
import { signupInput, signinInput, itemToSell, addItemTobag } from '../utils/zodValidator';
import { string } from 'zod';

const router = express.Router();



// routes to handle signup
// wiki : https://github.com/tripathysagar/E-vegi/wiki/The-backed#signup-using-1
router.post("/signup",async (req, resp) => {

    const parsedInput = signupInput.safeParse(req.body);
    if(!parsedInput.success){
        resp.status(400).send({
            "message": parsedInput.error
        })
        return;
    }

    const username = parsedInput.data.username;
    const password = generatePassword(parsedInput.data.password);
    const location = parsedInput.data.location;
    const firstName = parsedInput.data.firstName;
    const lastName = parsedInput.data.lastName;

    const seller = await Buyer.findOne({ username: username });

    if (seller) {
        resp.status(409).json({ message: 'User already exists' });
      } else {
        
        const newUser = new Buyer({ 
            username, 
            password, 
            location,
            firstName,
            lastName,
            bagId: undefined,
        });

        await newUser.save();
        const token = jwtSign(newUser._id.toString(), "buyer")
        console.log(location)
        console.log(newUser.bagId)
        resp.json({ message: 'User created successfully', token });
      }
      return
});

// https://github.com/tripathysagar/E-vegi/wiki/The-backed#signin-using-1
router.post("/signin", async (req, resp) =>{
    const parsedInput = signinInput.safeParse(req.body)
    if(!parsedInput.success){
        resp.status(400).send({
            "message": "Please enter valid input"
        })
        return;
    }

    

    const username = parsedInput.data.username;
    const password = generatePassword(parsedInput.data.password);

    const buyer = await Buyer.findOne({ username: username });

    if (buyer) {
        if(buyer.password === password){
            resp.status(200).json({ 
                message: 'signin sucessfull',
                token: jwtSign(buyer._id.toString(), "buyer")
             });
        }
        else{
            resp.status(401).json({ message: 'Please check user username and password' });
        }
      } else {
        resp.status(401).json({ message: 'Please register to login' });

      }
      return 
})


// https://github.com/tripathysagar/E-vegi/wiki/The-backed#get-the-unsold-items
router.get("/item", [validateJWT,  buyerAvailableItems], async (req: { body: any; }, resp: { send: (arg0: any) => void; }) =>{
    
    await req.body;
    resp.send(req.body);
})




// https://github.com/tripathysagar/E-vegi/wiki/The-backed#add-item-to-the-bag
router.post("/addToBag", validateJWT, async (req, resp) =>{

    const id = req.headers.id;
    const userType = req.headers.userType;

    const buyer = await Buyer.findById(id); // get buyer Id

    const parsedInput = addItemTobag.safeParse(req.body);
    if(!parsedInput.success){
        resp.status(400).send({
            "message": parsedInput.error
        })
        return;
    }
    // got correct resonse for the api
    let status : number;
    let message : any;

    const itemId:String = parsedInput.data.itemId;
    const quantityToBuy:Number = parsedInput.data.quantity;

    const item = await SellingItemList.findById(itemId);

    async function addToBag(itemId:String, quantityToBuy:Number){
        try{
            let bag = new Bag({
                isActive: true,
                buyerId: buyer?._id,
                items: [{
                    itemId:   itemId,
                    quantity: quantityToBuy,
                    isPresent: true,
                }]
            });
    
            await bag.save();
            
            if(buyer){ 
                console.log("inside if stmst")
                if(buyer.bagId === undefined)
                    buyer.bagId =  new ObjectId(bag?._id) ;
                else
                    buyer.bagId =  new  ObjectId(bag?._id) ;
                await buyer.save();
            }

            console.log(bag);
            resp.status(201).send(bag);
            return 
        }catch(error){
            console.log(error);
            return false
        }
        

    }
    // let the user access if it is buyer 
    if(item?.quantityAvailable !== undefined && item?.minSellingQuantity !== undefined && userType === 'buyer'){
        
        const amountLeft : Number = item?.quantityAvailable / item?.minSellingQuantity;
        
        if(quantityToBuy < amountLeft){
            status = 201;
            let message: any;

            
            
            //buyer does not have any bag 
            //initial case or after checkout 
            if(buyer?.bagId === undefined){
                let bag = addToBag(itemId, quantityToBuy);
                if(!bag){
                    message = "not able to inset";
                }else{
                    message = bag;
                }
                console.log(message);
            }else{//does exists 
                try{
                    const bag = await Bag.findById(buyer?.bagId);
                    const items = bag?.items;

                    let updated = false;

                    console.log(items);
                    //insert to the bag iff bag is in active state
                    if(items && bag.isActive){
                        for(let i = 0; i < items.length; i++){
                            if(String(items[i]?.itemId) === itemId){
                                // remove the item if the user removes the element 
                                if(Number(quantityToBuy) === 0){ 
            
                                    items.splice(i, 1);
                                    
                                }
                                // update the elements 
                                if(Number(quantityToBuy) > 0){
                                    items[i].quantity = Number(quantityToBuy);
                                }
                                updated = true;
                                break;
                            }
                        }

                        //if the item is not present in the items
                        if(!updated){
                            items.push({
                                itemId:   new ObjectId(itemId),
                                quantity: Number(quantityToBuy),
                                isPresent: true,
                            })
                        }

                        if(bag){
                            bag.items =  items;
                            await bag.save();
                        }
                        message = bag;
                        resp.status(201).send(bag);
                        return 
                    }else{
                        addToBag(itemId, quantityToBuy);
                        console.log("bags are in deactivate");
                        //resp.status(201).send(bag);
                        return 
                    }   

                }catch(error){
                    console.log(error);
                    resp.status(500).send(error);
                }
            }
   
        }else{
            status = 401;
            message = {
                "message" :"quantity is not available", 
                "amountLeft" : amountLeft
            };
            resp.status(401).json({
                message
            });
            return
        }  
        
    }
    

    return;
    

})

export default router;

