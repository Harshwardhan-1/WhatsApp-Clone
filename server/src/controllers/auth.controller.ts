import {Request,Response,NextFunction} from 'express';
import { User } from '../models/user.model';
import bcrypt from 'bcrypt';
import { JWT_SECRET,JWT_EXPIRES_IN } from '../configs/env.config';
import jwt,{Secret,SignOptions} from 'jsonwebtoken';
import { authRequest } from '../types/auth.Requests.types';

//it tells the type of it
const secret:Secret=JWT_SECRET!;
const options:SignOptions={
    expiresIn:JWT_EXPIRES_IN! as SignOptions['expiresIn']
}

const generateToken=(userId:string,email:string)=>{
    return jwt.sign(
        {id:userId,email:email},
        secret,
        options,
    )
}

export const signup=async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try{
        const {name,email,password}=req.body;
        if(!name || !email || !password){
            res.status(400).json({
                success:false,
                message:"All Fields are Required",
            });
            return;
        }
        const existingUser=await User.findOne({email:email.toLowerCase()});
        if(existingUser){
            res.status(409).json({
                success:false,
                message:"user already exist",
            });
            return;
        }
        const hashPassword=await bcrypt.hash(password,10);
        const user=await User.create({
            name,
            email,
            password:hashPassword,
        });
        if(!user){
            res.status(400).json({
                success:false,
                message:"Error creating User",
            });
        }
        const token=generateToken(user._id.toString(),email);
        res.cookie("token",token,{
            httpOnly:true,
            secure:true,
            sameSite:'none',
        });
        res.status(201).json({
            success:true,
            message:"successfully register",
            token,
        })
    }catch(err){
        console.log(err);
        next(err);
    }
}







export const signin=async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
    try{
        const {email,password}=req.body;
        if(!email || !password){
            res.status(400).json({
                success:false,
                message:"All Fields are Required",
            });
        }
        const user=await User.findOne({email:email.toLowerCase()});
        if(!user){
            res.status(400).json({
                success:false,
                message:"please do a signup first",
            });
            return;
        }
        const compare=await bcrypt.compare(password,user.password);
        if(!compare){
            res.status(400).json({
                success:false,
                message:"incorrect password",
            });
            return;
        }
        let token=generateToken(user._id.toString(),email);
        res.cookie("token",token,{
            httpOnly:true,
            secure:true,
            sameSite:"none",
        });
        res.status(200).json({
            success:true,
            message:"successfully verified",
            token,
        });
    }catch(err){
        next(err);
    }
}








export const logout=async(req:Request,res:Response,next:NextFunction):Promise<void>=>{
try{
    const token=req.cookies?.token;
    if(!token){
        res.status(400).json({
            success:false,
            message:"not login",
        });
        return;
    }
    res.clearCookie(token);
    res.status(200).json({
        success:true,
        message:"successfully logout",
    });
}catch(err){
    next(err);
}
}













export const allUsers=async(req:authRequest,res:Response,next:NextFunction)=>{
    try{
        const user=req?.user;
        const id=user?._id;
        const allUser=await User.find().select("_id name email");
        if(allUser.length===0){
            res.status(400).json({
                success:false,
                message:"new users will join soon",
            });
            return;
        }
        res.status(200).json({
            success:true,
            message:"all users",
            data:{
                allUser,
                currentUserId:id,
            }
        });
    }catch(err){
        next(err);
    }
}