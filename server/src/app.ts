import express from 'express';
import { Request,Response } from 'express';
import cookieParser from "cookie-parser";
import cors from 'cors';
import { FRONTEND_URL } from './configs/env.config';
import { ErrorMiddleware } from './middleware/error.middleware';

const app=express();
app.use(cookieParser());
app.use(cors({
    origin:FRONTEND_URL,
     methods:["GET","POST","PUT","DELETE"],
     credentials:true,
}));

import { authRouter } from './routes/auth.routes';

app.get("/",(req,res)=>{
    res.send("hii harsh here");
})



app.use("/api/v1/auth",authRouter);
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(ErrorMiddleware);

export default app;