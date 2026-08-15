import { authRequest } from "../types/auth.Requests.types";
import {Response,NextFunction} from 'express';
import { personalChat } from "../models/chat.model";
import { disappearingMessageValidator } from "../validators/disappearing.message.validator";
import { disappearingModel } from "../models/disappearing.message.model";
import { favourites } from "../models/favourites.model";


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




export const disappearingMessage=async(data:{senderId:string,receiverId:string,duration:string})=>{
    const parse=disappearingMessageValidator.safeParse(data);
    if(!parse.success){
        throw new Error(`${parse.error.issues[0].message}`);
    }
    try{
        const disappearMsg=await disappearingModel.findOne({
            $or:[
                {senderId:data.senderId,receiverId:data.receiverId},
                {senderId:data.receiverId,receiverId:data.senderId},
            ],
        });
        if(disappearMsg){
            disappearMsg.duration=parse.data.duration;
            await disappearMsg.save();
            return disappearMsg;
        }
        const create=await disappearingModel.create({
            senderId:data.senderId,
            receiverId:data.receiverId,
            duration:parse.data.duration,
        });
        if(!create){
            throw new Error("fail to update disappear message timer");
        }
        return create;
    }catch(err){
        throw new Error("something went wrong");
    }
}




export const currentDisapperingVal=async(data:{senderId:string,receiverId:string})=>{
    try{
        const msg=await disappearingModel.findOne({
            $or:[
                {senderId:data.senderId,receiverId:data.receiverId},
                {senderId:data.receiverId,receiverId:data.senderId},
            ],
        });
        if(msg){
            return msg.duration;
        }
    }catch(err){
        throw new Error("failed to get message");
    }
}






export const media=async(data:{senderId:string,receiverId:string})=>{
    try{
        const find=await personalChat.find({
            $or:[
                {senderId:data.senderId,receiverId:data.receiverId},
                {senderId:data.receiverId,receiverId:data.senderId},
            ],
            //regex means it match all the matching files starting with image/video ans options
            //is for case sensitive
            mimetype:{$regex:"^(image|video)",$options:"i"}
        }).sort({createdAt:1});
        return find;
    }catch(err){
        throw new Error("failed to laod media");
    }
}














export const alldocs=async(data:{senderId:string,receiverId:string})=>{
    try{
        const findDocs=await personalChat.find({
            $or:[
                {senderId:data.senderId,receiverId:data.receiverId},
                {senderId:data.receiverId,receiverId:data.senderId},
            ],
            mimetype:{$regex:"^(application)",$options:"i"},
        }).sort({createdAt:1});
        return findDocs;
    }catch(err){
        throw new Error("failed to get docs");
    }
}




export const allLinks=async(data:{senderId:string,receiverId:string})=>{
    try{
        const findLinks=await personalChat.find({
            $or:[
                {senderId:data.senderId,receiverId:data.receiverId},
                {senderId:data.receiverId,receiverId:data.senderId},
            ],
            //it checks all condition using and so no order matters
            message:{ $regex: "((https?:\\/\\/)?(www\\.)?[a-zA-Z0-9-]+\\.[a-zA-Z]{2,}(\\/[^\\s]*)?)", $options: "i" },
            messageType:"text", 
        }).sort({createdAt:1});
        return findLinks;
    }catch(err){
        throw new Error("failed to get links");
    }
}







export const check_favourites=async(data:{senderId:string,receiverId:string}):Promise<string>=>{
    try{
        const check=await favourites.findOne({
            senderId:data.senderId,receiverId:data.receiverId,
        });
        return check?"Remove From Favourites":"Add To Favourites";
    }catch(err){
        throw new Error("failed to check if it is in favourites or not");
    }
}





export const mark_as_favourites=async(data:{senderId:string,receiverId:string})=>{
    try{
        const markAsFavourites=await favourites.findOne({
            senderId:data.senderId,
            receiverId:data.receiverId,
        });
        if(markAsFavourites){
            markAsFavourites.IsMarkedAsFavourites=true;
            await markAsFavourites.save();
            return;
        }
        const create=await favourites.create({
            senderId:data.senderId,
            receiverId:data.receiverId,
            IsMarkedAsFavourites:true,
        });
        if(!create){
            throw new Error("failed to mark as favourites");
        }
    }catch(err){
        throw new Error("failed to mark as favourites");
    }
}





export const unmarked_as_favourites=async(data:{senderId:string,receiverId:string})=>{
    try{
        const unmarkedAsFavourites=await favourites.findOne({
            senderId:data.senderId,
            receiverId:data.receiverId,
        });
        if(unmarkedAsFavourites){
            unmarkedAsFavourites.IsMarkedAsFavourites=false;
            await unmarkedAsFavourites.save();
            return;
        }
    }catch(err){
        throw new Error("failed to unmarked favourites");
    }
}