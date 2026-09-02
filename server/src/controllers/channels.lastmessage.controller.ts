import { channelLastMessage } from "../models/channel.lastmessage.model";
import { createChannelMsgConfig } from "../configs/channels.config";
import mongoose from 'mongoose';
import { channelMessage } from "../models/channels.message.model";


export const storeLastMessage=async(data:createChannelMsgConfig)=>{
    try{
        const lastMsg=await channelLastMessage.findOne({channelId:data.channelId});
        if(lastMsg){
            lastMsg.channelId=new mongoose.Types.ObjectId(data.channelId);
            lastMsg.senderId=new mongoose.Types.ObjectId(data.senderId),
            lastMsg.msgId=lastMsg.msgId,
            lastMsg.message=data.message;
            lastMsg.messageType=data.messageType;
            lastMsg.orignalname=data?.orignalname;
            lastMsg.mimetype=data?.mimetype;
            await lastMsg.save();
            return lastMsg;
        }else{
            const create=await channelLastMessage.create({
                channelId:data.channelId,
                senderId:data.senderId,
                msgId:data.msgId,
                message:data.message,
                messageType:data.messageType,
                orignalname:data?.orignalname,
                mimetype:data?.mimetype,
            });
            if(!create){
                throw new Error("failed to create last message");
            }
            return create;
        }
    }catch(err){
        throw err;
    }
}



//message delet sa pahala delhenga


export const update_last_message_delete=async(data:{channelId:string,senderId:string})=>{
    try{
       const lastMessage=await channelMessage.findOne(
        {channelId:data.channelId,messageType:{$nin:["system"]}
    });
    if(!lastMessage)return;
    const lastMsg=await channelLastMessage.findOne({channelId:data.channelId});
    if(lastMsg){
        lastMsg.senderId=lastMessage.senderId;
        lastMsg.msgId=lastMessage._id.toString(),
        lastMsg.message=lastMessage.message;
        lastMsg.messageType=lastMessage.messageType;

        await lastMsg.save();
        return lastMsg;
    }
    }catch(err){
        throw err;
    }
}









//we will only update chat list in edit if it is the last message of the channel
//other wise we will not update the chatlist
export const channel_last_message_edit=async(data:
    {channelId:string,msgId:string,senderId:string,message:string}
)=>{
    try{
        const lastMsg=await channelLastMessage.findOne({channelId:data.channelId,messageType:{$nin:["system"]}});
        if(!lastMsg){
            return;
        }
        if(lastMsg.msgId.toString()!==data.msgId.toString()){
            return;
        }
        lastMsg.message=data.message;
        await lastMsg.save();
        return lastMsg;
    }catch(err){
        throw err;
    }
}