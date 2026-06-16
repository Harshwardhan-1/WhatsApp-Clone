import mongoose from 'mongoose';
import {Document,Types} from 'mongoose';

export interface IChat extends Document{
    senderId:string,
    receiverId:string,
    message:string,
    fileUrl?:string,
    isSeen:boolean,
    isDelivered:boolean,
    createdAt:Date,
    updatedAt:Date,
}



const chatSchema=new mongoose.Schema<IChat>({
    senderId:{
        type:String,
        ref:"user",
        required:[true,'senderId is missing'],
    },
    receiverId:{
        type:String,
        ref:"user",
        required:[true,'receiverId is missing'],
    },
    message:{
        type:String,
        required:[true,'message field cant be empty '],
        trim:true,   
        minLength:[1,'atleast have 1 characters'],
    },
    fileUrl:{
        type:String,
        default:null,
        fileSize:String,
        mimetype:String,
    },
    isSeen:{
        type:Boolean,
        default:false,
    },
    isDelivered:{
        type:Boolean,
        default:false,
    }
},
{timestamps:true},
)


export const Chat=mongoose.model<IChat>("users chat",chatSchema);