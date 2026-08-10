import { authRequest } from "../types/auth.Requests.types";
import {Response,NextFunction} from 'express';
import { personalChat } from "../models/chat.model";

export const clear_chat=async(data:{senderId:string,receiverId:string})=>{
    try{
        await personalChat.updateMany({
            $or:[
                {
                    senderId:data.senderId,
                    receiverId:data.receiverId,
                },
                {
                    senderId:data.receiverId,
                    receiverId:data.senderId,
                },
            ]
        },
        //we can also use loop chat[i].push(data.senderId);
        {$addToSet:{isClear:data.senderId}}
    );
    }catch(err){
        throw new Error("failed to clear chat");
    }
}