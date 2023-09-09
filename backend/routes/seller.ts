import jwt from "jsonwebtoken";
import express from 'express';
import z from "zod";

import { Seller, SellingList } from "../db/index";
import generatePassword from "../utils/generatePassword";

const router = express.Router();

const SECRET = "SEller_secret"

export const signupInput = z.object({
    username: z.string().email(),
    password: z.string().min(5).max(15),
    location: z.string().nonempty(),
})

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
        const token = jwt.sign({ id: newUser._id }, SECRET, { expiresIn: '1h' });
        resp.json({ message: 'User created successfully', token });
      }
});

    


export default router