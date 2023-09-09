import express from 'express';
import z from "zod";

import { Buyer, SellingItemList } from "../db/index";
import generatePassword from "../utils/generatePassword";
import jwtSign from '../utils/jwtSign';
import {validateJWT} from '../middleware/validateJWT';
import { signupInput, signinInput, itemToSell } from '../utils/zodValidator';

const router = express.Router();



// routes to handle signup
// wiki : https://github.com/tripathysagar/E-vegi/wiki/The-backed#signup-using-1
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
                token: jwtSign(buyer._id.toString(), "seller")
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



export default router;