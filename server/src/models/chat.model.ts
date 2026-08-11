import mongoose from 'mongoose';
import {Document,Types} from 'mongoose';




export interface IChat extends Document{
    senderId:string,
    receiverId:string,
    message:string,
    messageType:string,
    mimetype?:string,
    filename?:string,
    sizeInKb?:number,
    sizeInMb?:number,
    originalname?:string,
    fileUrl?:string,
    IsSend:boolean,
    isSeen:boolean,
    isDelivered:boolean,
    hideIt:string[],
    isClear:string[],
    isSenderClear?:boolean,
    isReceiverClear?:boolean,
    isEdited:boolean,
    createdAt:Date,
    updatedAt:Date,
    expiresAt?:Date | null,
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
    messageType:{
        type:String,
        required:true,
        default:"text",
    },
    mimetype:{
        type:String,
        default:"image",
    },
    filename:{
        type:String,
        default:"",
    },
    sizeInKb:{
        type:Number,
        default:0,
    },
    sizeInMb:{
        type:Number,
        default:0,
    },
    originalname:{
        type:String,
        default:"",
    },
    fileUrl:{
        type:String,
        default:null,
    },
    IsSend:{
        type:Boolean,
        default:false,
    },
    isSeen:{
        type:Boolean,
        default:false,
    },
    isDelivered:{
        type:Boolean,
        default:false,
    },
    hideIt:{
        type:[String],
        default:[],
    },
    isClear:{
        type:[String],
        default:[],
    },
    isEdited:{
        type:Boolean,
        default:false,
    },
    expiresAt:{
        type:Date,
        default:null,
    },
},
{timestamps:true}, 
)


//expireAfterSecondsecond matlab itna samay baad delete kardo es document ko 
//mongodb internally check after every seconds whether to delete it or not
chatSchema.index({expiresAt:1},{expireAfterSeconds:0});

export const personalChat=mongoose.model<IChat>("personalchat",chatSchema);     