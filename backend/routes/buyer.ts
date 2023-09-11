import express from 'express';
import mongoose from "mongoose";


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
    
    // let the user access if it is buyer 
    if(item?.quantityAvailable !== undefined && item?.minSellingQuantity !== undefined && userType === 'buyer'){
        
        const amountLeft : Number = item?.quantityAvailable / item?.minSellingQuantity;
        
        if(quantityToBuy < amountLeft){
            status = 200;
            message = "item added";

            const buyer = await Buyer.findById(id);
            let bag:any;
            //buyer does not have any bag 
            //initial case or after checkout 
            if(buyer?.bagId === undefined){
                bag = new Bag({
                    isActive: false,
                    buyerId: buyer?._id,
                    items: [{
                        itemId:   itemId,
                        quantity: quantityToBuy,
                        isPresent: true,
                    }]
                });
                await bag.save();
                console.log(buyer);
                
                if(buyer === null) return 
                buyer.bagId = bag?._id;

                await buyer.save();
            }else{//does exists 

            }
            
            
            

           
        }else{
            status = 401;
            message = ["quantity is not available", amountLeft];
        }
        resp.status(status).json({
            message : message
        });
        
    }
    

    return;
    

})

export default router;

