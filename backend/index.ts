import express from 'express';
import mongoose from "mongoose";

import sellerRouter from "./routes/seller";
import buyerRouter from "./routes/buyer";

mongoose.connect('mongodb+srv://tripathysagar:beEdGeIvshWcbA8t@cluster0.3prb9kq.mongodb.net/E-vegi', { dbName: "E-vegi" });
const app = express()
const port = 3000;

app.get('/', (req, res)=>{
    res.send("hello there")
})

app.use(express.json())
app.use("/seller", sellerRouter)
app.use("/buyer", buyerRouter)


app.listen(port, ()=>{
    console.log("server is running @"+port)
})

