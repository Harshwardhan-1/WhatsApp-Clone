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
            hideIt:{
                $nin:[senderId],
            }
        }).sort({createdAt:1});
         res.status(200).json({
            success:true,
            message:"got all chat",
            data:getPrevChat,
        });
        return;
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




//sender ones
export const delete_from_everyone=async(_id:string):Promise<void>=>{
try{
    const check=await personalChat.findByIdAndDelete({_id});
    if(!check){
        throw new Error("cannot find message");
    }else{
        return;
    }
}catch(err){
    throw new Error("error in deleting");
}
}




export const edit=async(data:{_id:string,msg:string})=>{
    try{
        const editIt=await personalChat.findByIdAndUpdate(data._id,{message:data.msg},{returnDocument:"after"});
        if(!editIt){
            throw new Error("fail to edit message");
        }
        return editIt;
    }catch(err){
        throw new Error("fail to edit message");
    }
}






export const delete_from_me=async(data:{_id:string,senderId:string,receiverId:string}):Promise<void>=>{
    try{
       const markDeleted=await personalChat.findById(data._id);
       if(!markDeleted){
        throw new Error("message not found");
    }else{
        markDeleted.hideIt.push(data.senderId);
        await markDeleted.save();
        return;
    }
    }catch(err){
        throw new Error("error in deleting");
    }
}