import jwt from "jsonwebtoken";

import {SECRET} from '../config';

export default function jwtSign(id: String, role: String): String{
    return jwt.sign(
                    { 
                        id: id, 
                        userType: role,
                    }, 
                    SECRET, 
                    { expiresIn: '1h' }
                );
}