import mongoose,{Document,Types} from 'mongoose';

export interface IGroupConversion extends Document{
    groupId:Types.ObjectId,
    msgId:Types.ObjectId,
    senderId:Types.ObjectId,
    message:string,
    messageType:string,
    orignalname?:string,
    filename?:string,
    mimetype?:string,
    createdAt:Date,
    updatedAt:Date,
}




const groupConversion=new mongoose.Schema<IGroupConversion>({
    groupId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"group_create",
        required:[true,'groupId is missing'],
    },
    senderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:[true,'unauthorized login again'],
    },
     msgId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"group_messages",
        required:[true,'msgId is missing'],
    },
    message:{
        type:String,
        required:[true,'messageField is mandatory'],
    },
    messageType:{
        type:String,
        required:[true,'messageType is required'],
    },
    orignalname:{
        type:String,
        default:"",
    },
    filename:{
        type:String,
        default:"",
    },
    mimetype:{
        type:String,
        default:"",
    },
},
{timestamps:true}
);


export const groupLastMessage=mongoose.model<IGroupConversion>("group_last_message",groupConversion);