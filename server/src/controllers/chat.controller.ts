import {Request,Response,NextFunction} from 'express';
import { personalChat } from '../models/chat.model';
import { createWriteStream } from 'fs';

interface personalMsg{
    senderId:string,
    receiverId:string,
    msg:string,
}

export const PersonalChat=async(data:personalMsg)=>{
try{
    const createIt=await personalChat.create({
        senderId:data.senderId,
        receiverId:data.receiverId,
        message:data.msg,
    });
    return createIt;
}catch(err){
console.log(err);
throw err;
}
}