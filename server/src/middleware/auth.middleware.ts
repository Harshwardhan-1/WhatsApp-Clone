import {Request,Response,NextFunction} from 'express';
import { userpayload } from "../types/auth.Requests.types";
import { authRequest } from "../types/auth.Requests.types";
import { JWT_SECRET } from '../configs/env.config';
import jwt from 'jsonwebtoken';
import { userModel } from '../models/user.model';


export const isUserLoggedIn=async(req:authRequest,res:Response,next:NextFunction)=>{
    try{
        const token=req.cookies?.token;
        if(!token){
            return res.status(401).json({
                success:false,
                message:"token not found",
            });
        }
        //after verificaton it the data that we set in token is easily identifiable by decodeddata
        const decodedData=jwt.verify(token,JWT_SECRET as string)as userpayload;
        const user=await userModel.findOne({email:decodedData.email});
        if(!user){
            return res.status(400).json({
                success:false,
                message:"login required",
            });
        }
        req.user=user;
        next();
    }catch(err){
        next(err);
    }
}






export const isAdminLoggedIn=async(req:authRequest,res:Response,next:NextFunction)=>{
    try{
        const token=req.cookies?.token;
        if(!token){
            return res.status(401).json({
                success:false,
                message:"token not found",
            });
        }
        const decodedData=jwt.verify(token,JWT_SECRET as string) as userpayload;
        const user=await userModel.findOne({email:decodedData.email});
        if(!user || user.role!== 'ADMIN'){
            return res.status(403).json({
                success:false,
                message:"Access Denied",
            });
        }
        req.user=user;
        next();
    }catch(err){
        next(err);
    }
}