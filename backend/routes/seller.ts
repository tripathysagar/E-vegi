import express from 'express';
import z from "zod";

import { Seller, SellingItemList } from "../db/index";
import generatePassword from "../utils/generatePassword";
import jwtSign from '../utils/jwtSign';
import {validateJWT} from '../middleware/validateJWT';

const router = express.Router();


const signupInput = z.object({
    username: z.string().email(),
    password: z.string().min(5).max(15),
    location: z.string().nonempty(),
});

const signinInput = z.object({
    username: z.string().email(),
    password: z.string().min(5).max(15),
});

const itemToSell = z.object({
    name: z.string().nonempty(),
    description: z.string().nonempty(),
    imageLink : z.string().url(),
    quantityAvailable:  z.string(),
    minSellingQuantity : z.string().nonempty(),
    pricePerUnit: z.number().positive(),
    location: z.string().nonempty()
});


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

    const seller = await Seller.findOne({ username: username });

    if (seller) {
        resp.status(409).json({ message: 'User already exists' });
      } else {
        const newUser = new Seller({ username, password, location });
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
            const quantityAvailable = body.quantityAvailable;
            const minSellingQuantity = body.minSellingQuantity;
            
            
            if(minSellingQuantity > quantityAvailable){
                    message = "the min selling unit is grater than available units";
                    status = 400;
            }
            else{
                
                const item = await SellingItemList.findOne({ name: body.name});

                if(item){
                    message = "item already present";
                    status = 401;
                }else{
                    const sellingItem = new SellingItemList({ 
                        name: body.name,
                        description: body.description,
                        imageLink: body.imageLink,
                        quantityAvailable: quantityAvailable,
                        minSellingQuantity: minSellingQuantity,
                        pricePerUnit: body.pricePerUnit,
                        location: body.location,
                    });
                    await sellingItem.save();

                    const itemId = seller.itemId;
                    itemId.push(sellingItem._id);
                    
                    await seller.updateOne({
                        itemId: itemId
                    })
                    console.log(itemId)
                    message = "item added";
                    status = 200;
                }
            }
            
            
        }
    }else{
        message = "please sign-in";
        status = 401;
    }

    resp.status(status).send({message : message});

})

export default router