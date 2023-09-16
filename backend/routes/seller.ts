import express from 'express';
import mongoose from "mongoose";


import { Buyer, Seller, SellingItemList } from "../db/index";
import generatePassword from "../utils/generatePassword";
import jwtSign from '../utils/jwtSign';
import {validateJWT} from '../middleware/validateJWT';
import { signupInput, signinInput, itemToSell } from '../utils/zodValidator';
const router = express.Router();





let status : number;
let message: any;

// routes to handle signup
// wiki : https://github.com/tripathysagar/E-vegi/wiki/The-backed#signup-using
router.post("/signup",async (req, resp) => {

    const parsedInput = signupInput.safeParse(req.body)
    if(!parsedInput.success){
        resp.status(400).send({
            "message": "Please enter valid input"
        })
        return;
    }

    

    const username = parsedInput.data.username;
    const password = generatePassword(parsedInput.data.password);
    const location = parsedInput.data.location;
    const firstName = parsedInput.data.firstName;
    const lastName = parsedInput.data.lastName;

    const seller = await Seller.findOne({ username: username });

    if (seller) {
        resp.status(409).json({ message: 'User already exists' });
      } else {
        const newUser = new Seller({ 
            username, 
            password, 
            location,
            firstName,
            lastName,
            moneyRecived :0
         });
        await newUser.save();
        const token = jwtSign(newUser._id.toString(), "seller")
        resp.json({ message: 'User created successfully', token });
      }
      return
});


// routes to handle signin
// wiki: https://github.com/tripathysagar/E-vegi/wiki/The-backed#signin-using
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

    const seller = await Seller.findOne({ username: username });

    if (seller) {
        if(seller.password === password){
            resp.status(200).json({ 
                message: 'signin sucessfull',
                token: jwtSign(seller._id.toString(), "seller")
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


// https://github.com/tripathysagar/E-vegi/wiki/The-backed#add-item-to-sell
router.post("/item", validateJWT, async(req, resp) =>{
    const id = req.headers.id;
    const userType = req.headers.userType;

    const seller = await Seller.findById(id);
    if(seller && userType === 'seller'){
        const body = req.body;
        const parsedInput = itemToSell.safeParse(body);
        if(!parsedInput.success){
            status = 400;
            message = parsedInput.error;
        }
        else{
            const quantityAvailable = parsedInput.data.quantityAvailable;
            const minSellingQuantity = parsedInput.data.minSellingQuantity;
            
            console.log(body)
            
            if(minSellingQuantity > quantityAvailable){
                    message = "the min selling unit is grater than available units";
                    status = 400;
            }
            else{
                
                //const item = await SellingItemList.findOne({ name: parsedInput.data.name});

                
                const sellingItem = new SellingItemList({ 
                            name: parsedInput.data.name,
                            description: parsedInput.data.description,
                            imageLink: parsedInput.data.imageLink,
                            quantityAvailable: quantityAvailable,
                            minSellingQuantity: minSellingQuantity,
                            pricePerUnit: parsedInput.data.pricePerUnit,
                            location: parsedInput.data.location,
                            dateAdded: Date.now(),
                            sellerId: seller._id,
                });
                await sellingItem.save();

                
                const itemId : any= seller.itemId;
                itemId.push(sellingItem._id);
                    
                    await seller.updateOne({
                        itemId: itemId
                    })
                    //console.log(itemId)
                    message = "item added";
                    status = 200;
                
            }
            
            
        }
    }else{
        message = "please sign-in";
        status = 401;
    }

    resp.status(status).send({message : message});

})


// https://github.com/tripathysagar/E-vegi/wiki/The-backed#items-that-are-left-to-be-sold
router.get("/item", validateJWT, async(req, resp) =>{
    const id = req.headers.id;
    const userType = req.headers.userType;

    const seller = await Seller.findById(id);
    if(seller && userType === 'seller'){
        
        message = [];
        const sellerItems = seller.itemId;
        console.log(sellerItems)
        for(let i =0; i < sellerItems.length; i++){
            
            const item = await SellingItemList.findById(sellerItems[i]);
            console.log(item)
            
                message.push({
                    id: item?._id,
                    name: item?.name,
                    description: item?.description,
                    imageLink: item?.imageLink,
                    quantityAvailable: item?.quantityAvailable,
                    minSellingQuantity: item?.minSellingQuantity,
                    pricePerUnit: item?.pricePerUnit,
                    location: item?.location,
                    dateAdded: item?.dateAdded
                });
            
        }

        message = message.sort((a:any, b:any) => b.dateAdded - a.dateAdded)
        status = 200
        
    }else{
        message = "please sign-in";
        status = 401;
    }

    resp.status(status).send( message);

})



router.get("/user", validateJWT, async(req, resp) =>{
    const id = req.headers.id;
    const userType = req.headers.userType;

    const seller = await Seller.findById(id);
    if(seller && userType === 'seller'){
        
        
        status = 200
        resp.status(status).send({
            firstName: seller?.firstName,
            moneyRecived: seller?.moneyRecived
        });
        return 

        
    }else{
        message = "please sign-in";
        status = 401;
    }

    resp.status(status).send({message : message});

})

// https://github.com/tripathysagar/E-vegi/wiki/The-backed#sold-history
router.get("/soldHistory", validateJWT, async(req, resp) =>{
    const id = req.headers.id;
    const userType = req.headers.userType;

    const seller = await Seller.findById(id);
    
        
    if(userType === 'seller')
    {
            

            
            async function fetchSoldItems() {
                return new Promise(async (resolve, reject) => {
                try {
                  if (seller) {
                    let soldItemsHistory: any[] = [];
              
                    for (const item of seller.itemId) {
                      const sellingItem = await SellingItemList.findById(item);
                      const orderStatus = sellingItem?.orderStatus;
              
                      console.log(sellingItem);
              
                      if (orderStatus !== undefined) {
                        for (let i = 0; i < orderStatus.length; i++) {
                          const buyer = await Buyer.findById(orderStatus[i].buyId);
              
                          soldItemsHistory.push({
                            dateOrdered: orderStatus[i]?.dateOrdered,
                            quantity: orderStatus[i]?.quantity,
                            location: buyer?.location,
                            name: sellingItem?.name,
                            pricePerUnit: sellingItem?.pricePerUnit,
                            imageLink: sellingItem?.imageLink,
                          });
              
                          console.log(soldItemsHistory);
                        }
                        // You can sort the soldItemsHistory array here if needed.
                      }
                    }
                    // Resolve the promise after the loop has completed and you have collected all the data.
                    resolve(soldItemsHistory);
                  }
                } catch (error) {
                  reject(error);
                }})}
              
              
            const responseData = await fetchSoldItems();
            resp.status(200).send(responseData);
            console.log("blaj")
            return;
    }
        /*catch(error){
            console.log(error);
            resp.status(500).send(error);
            return;
        }
        */
        resp.status(401).send({message : "please sign-in"});

        
})

export default router;