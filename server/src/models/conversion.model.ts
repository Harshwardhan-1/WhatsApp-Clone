import mongoose from 'mongoose';
import {Document,Types} from 'mongoose';
import { minLength } from 'zod';

export interface ILastMessage extends Document{
    senderId:string,
    receiverId:string,
    lastmessage:string,
    messageType:string,
    image?:string,
    video?:string,
}


const lastmessage=new mongoose.Schema<ILastMessage>({
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
        required:[true,'message is required'],
        minLength:[1,'message should be atleast of 1 length'],
    },
    messageType:{
        type:String,
        required:[true,'message type is missing'],
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