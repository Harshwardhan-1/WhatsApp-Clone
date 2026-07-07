import mongoose from 'mongoose';
import {Document,Types} from 'mongoose';
import { minLength } from 'zod';

export interface ILastMessage extends Document{
    lastMessageId:mongoose.Schema.Types.ObjectId,
    senderId:string,
    receiverId:string,
    lastmessage:string,
    messageType:string,
    createdAt:Date,
    updatedAt:Date,
    image?:string,
    video?:string,
}


const lastmessage=new mongoose.Schema<ILastMessage>({
    lastMessageId:{
        type:mongoose.Schema.Types.ObjectId,
    },
    senderId:{
        type:String,
        required:[true,'senderId is missing'],
    },
    receiverId:{
        type:String,
        required:[true,'receiverId is missing'],
    },
    lastmessage:{
        type:String,
        default:"",
    },
    messageType:{
        type:String,
        required:[true,'message type is missing'],
    },
    createdAt:{
        type:Date,
    },
    updatedAt:{
        type:Date,
    },
    image:{
        type:String,
        default:null,
    },
    video:{
        type:String,
        default:null,
    }
},{timestamps:true});



export const lastMessage=mongoose.model<ILastMessage>("last_message",lastmessage);