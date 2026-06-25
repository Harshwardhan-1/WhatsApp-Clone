import {Request,Response,NextFunction} from 'express';
import { personalChat } from '../models/chat.model';
import { userlastpresence } from '../models/user.lastpresence.model';

interface personalMsg{
    senderId:string,
    receiverId:string,
    msg:string,
}


interface lastpresence{
    userId:string,
}

export const PersonalChat=async(data:personalMsg)=>  {
try{
    //this is for testing whether it is working correctly or not
    // throw new Error("Test Error");
    const createIt=await personalChat.create({
        senderId:data.senderId,     
        receiverId:data.receiverId,
        message:data.msg,
    });
    return createIt;
}catch(err){
console.log(err);
throw new Error("error saving chat in db");
}
}





export const prevChat=async(req:Request,res:Response,next:NextFunction)=>{
    try{
        const {senderId,receiverId}=req.body;
        if(!senderId || !receiverId){
               res.status(400).json({
                success:false,
                message:"senderId or receiverId is missing",
            });
            return;
        }
        const getPrevChat=await personalChat.find({
            $or:[{
                senderId:senderId,
                receiverId:receiverId,
            },{
                senderId:receiverId,
                receiverId:senderId,
            }],
        }).sort({createdAt:1});
        return res.status(200).json({
            success:true,
            message:"got all chat",
            data:getPrevChat,
        });
    }catch(err){
        next(err);
    }    
}










export const userlastVisit=async(data:lastpresence)=>{
    try{
        const findIt=await userlastpresence.findOne({userId:data.userId});
        if(findIt){
           findIt.date=new Date(Date.now()),
           await findIt.save();
           return findIt;
        }else{
            const createPresence=await userlastpresence.create({
                userId:data.userId,
                date:new Date(Date.now()),
            });
            return createPresence;
        }
    }catch(err){
        console.log(err);
        throw new Error("error saving last presence");
    }
}