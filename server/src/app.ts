import express from 'express';
import { Request,Response } from 'express';
import cookieParser from "cookie-parser";
import cors from 'cors';
import { FRONTEND_URL } from './configs/env.config';
import { ErrorMiddleware } from './middleware/error.middleware';

const app=express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin:FRONTEND_URL,
     methods:["GET","POST","PUT","DELETE"],
     credentials:true,
}));

import { authRouter } from './routes/auth.routes';
import { chatpageRoutes } from './routes/chat.routes';

app.get("/",(req,res)=>{
    res.send("hii harsh here");
})



app.use("/api/v1/auth",authRouter);
app.use("/api/v1/chat",chatpageRoutes);
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(ErrorMiddleware);

export default app;





//add task
//show input icon for image upload and video upload