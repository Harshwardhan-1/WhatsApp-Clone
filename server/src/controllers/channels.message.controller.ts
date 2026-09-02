import { channels } from "../models/channels.model";
import { channelMessage } from "../models/channels.message.model";
import type { createChannelMsgConfig } from "../configs/channels.config";
import {Socket,Server} from 'socket.io';
import { storeLastMessage } from "./channels.lastmessage.controller";
import { update_last_message_delete } from "./channels.lastmessage.controller";
import { channel_last_message_edit } from "./channels.lastmessage.controller";


export const createMsg=async(data:createChannelMsgConfig,
    socket:Socket,io:Server,
    users:{[key:string]:string}
)=>{
    try{
        const channel=await channels.findById(data.channelId);
        if(!channel){
            throw new Error("the channel don't exist or something went wrong");
        }
        //check senderId
        const canSendMsg=channel.admin.some(
            (id)=>id.toString()===data.senderId.toString()
        );
        if(!canSendMsg){
            throw new Error("Access Denied don't have persmission to send msg");
        }
        const create=await channelMessage.create({
            channelId:data.channelId,
            senderId:data.senderId,
            message:data.message,
            messageType:data.messageType,
            orignalname:data?.orignalname,
            mimetype:data?.mimetype,
            expiresAt:new Date(Date.now()+30*24*60*60*1000)
        });
        if(!create){
            throw new Error("failed to create Msg");
        }


        const lastMsg=await storeLastMessage({
            channelId:data.channelId,
            senderId:data.senderId,
            msgId:create._id.toString(),
            message:data.message,
            messageType:data.messageType,
            orignalname:data?.orignalname,
            mimetype:data?.mimetype,
        });

        //here we will update channel chat list


        for(let i=0;i<channel.followers.length;i++){
            const id=channel.followers[i].toString();
            if(id===data.senderId.toString())continue;
            const checkNotification=channel.muteNotification.some(
                (id)=>id.toString()===id.toString()
            );
            let sound="off";
            if(!checkNotification){
                sound="on";
            }
            const receiverSocketId=users[id];
            if(receiverSocketId){
                io.to(receiverSocketId).emit("channel_receive_message",({...create.toObject(),notificationSound:sound}));
                io.to(receiverSocketId).emit("update_channel_chatlist",(lastMsg));
            }
        }
        socket.emit("channel_receive_message",(create));
        socket.emit("update_channel_chatlist",(lastMsg));
    }catch(err){
        throw err;
    }
}











//here delete msg from everyone it is
export const deleteMsg=async(data:
    {channelId:string,senderId:string,msgId:string}
    ,socket:Socket,io:Server,users:{[key:string]:string},
)=>{
    try{
        const channel=await channels.findById(data.channelId);
        if(!channel){
            throw new Error("channel not exist");
        }
        const msg=await channelMessage.findById(data.msgId);
        if(!msg){
            throw new Error("msg not found");
        }
        if(msg.senderId.toString()!==data.senderId.toString()){
            throw new Error("don't have access to delete this message");
        }
        await msg.deleteOne();
        const update_last_message=await update_last_message_delete({channelId:data.channelId,senderId:data.senderId});
        for(let i=0;i<channel.followers.length;i++){
            const id=channel.followers[i].toString();
            const receiverSocketId=users[id];
            if(id===data.senderId.toString())continue;
            if(receiverSocketId){
                io.to(receiverSocketId).emit("deleted_channel_msg",({channelId:data.channelId,msgId:data.msgId})); 
                io.to(receiverSocketId).emit("update_channel_chatlist",(update_last_message));
            }
        }
        socket.emit("deleted_channel_msg",({channelId:data.channelId,msgId:data.msgId}));
        socket.emit("update_channel_chatlist",(update_last_message));
    }catch(err){
        throw err;
    }
}







//we have to show delete for me message only to admin not to anyone
export const delete_msg_from_me=async(data:{channelId:string,msgId:string,senderId:string},socket:Socket)=>{
    try{
        const channel=await channels.findById(data.channelId);
        if(!channel){
            throw new Error("channel not found");
        }
        const msg=await channelMessage.findById(data.msgId);
        if(!msg){
            throw new Error("msg not found");
        }
        msg.hideIt.push(data.senderId);
        await msg.save();
        socket.emit("delete_channel_msg",({channelId:data.channelId,mzgId:data.msgId}));
    }catch(err){
        throw err;
    }
}




export const msgEditted=async(data:
    {channelId:string,msgId:string,senderId:string,message:string},
    socket:Socket,io:Server,users:{[key:string]:string},
)=>{
    try{
        const channel=await channels.findById(data.channelId);
        if(!channel){
            throw new Error("channel not found");
        }
        const msg=await channelMessage.findById(data.msgId);
        if(!msg){
            throw new Error("msg not found");
        }
        if(msg.senderId.toString() !==data.senderId.toString()){
            throw new Error("don't have access to edit this message");
        }
        msg.message=data.message;
        await msg.save();
        const updated=await channel_last_message_edit({channelId:data.channelId,msgId:data.msgId,senderId:data.senderId,message:data.message});
        for(let i=0;i<channel.followers.length;i++){
            const id=channel.followers[i].toString();
            if(id===data.senderId.toString())continue;
            const receiverSocketId=users[id];
            if(receiverSocketId){
                io.to(receiverSocketId).emit("channel_msg_updated",(msg));
                //chat list update
                if(updated){
                io.to(receiverSocketId).emit("update_channel_chatlist",(updated));
            }
            }
        }
        socket.emit("channel_msg_updated",(msg));
        if(updated){
        socket.emit("update_channel_chatlist",(updated));
        }
    }catch(err){
        throw err;
    }
}









//all pending channel list message