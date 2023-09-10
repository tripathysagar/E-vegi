import jwt from "jsonwebtoken";

import {SECRET} from '../config';


import { Request, Response, NextFunction } from "express";

export const validateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, SECRET, (err, payload) => {
      if (err) {
        return res.sendStatus(403).send({
          message: "Decoding error"
        });
      }
      if (!payload) {
        return res.sendStatus(403).send({
          message: "missing mandatory field"
        });
      }
      if (typeof payload === "string") {
        return res.sendStatus(403).send({
          message: "invalid data"
        });
      }
      
      //console.log(payload)
      req.headers["id"] = payload.id;
      req.headers["userType"] = payload.userType;

      next();
    });
  } else {
    res.sendStatus(401);
  }
};