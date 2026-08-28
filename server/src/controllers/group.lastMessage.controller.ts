import { groupChatModel } from "../models/group.create.model";
import { groupMessage } from "../models/group.message.model";
import { groupLastMessage } from "../models/group.conversion.model";
import {Socket,Server} from 'socket.io';
import mongoose from 'mongoose';
import {io,users} from "../Socket/socket";
import type { IGroupMessage } from "../models/group.create.model";
import { allPendingMessage, emitPendingCountToUser } from "./group.message.controller";


interface groupLastMessageConfig{
    groupId:string,
    senderId:string,
    msgId:string,
    message:string,
    messageType:string,
    orignalname?:string,
    filename?:string,
    mimetype?:string,
}

export const storeGroupLastMessage=async(data:groupLastMessageConfig,group:IGroupMessage)=>{
    try{
        if(data.messageType==="system")return;
        const lastMessage=await groupLastMessage.findOne({groupId:data.groupId});
        if(lastMessage){
            lastMessage.senderId=(new mongoose.Types.ObjectId(data.senderId));
            lastMessage.msgId=(new mongoose.Types.ObjectId(data.msgId));
            lastMessage.message=data.message;
            lastMessage.messageType=data.messageType;
            lastMessage.orignalname=data?.orignalname;
            lastMessage.filename=data?.filename;
            lastMessage.mimetype=data?.mimetype;
            await lastMessage.save();
            for(let i=0;i<group.peoplesId.length;i++){
                const id=group.peoplesId[i].toString();
                const receiverSocketId=users[id];
                if(receiverSocketId){
                    io.to(receiverSocketId).emit("group_chat_list_update",(lastMessage));
                }
                // naya message aaya - sabko (sender ke alawa) unka fresh unread count bhi bhejo
                if(id!==data.senderId.toString()){
                    await emitPendingCountToUser(id, io, users);
                }
            }
        }else{
            const create=await groupLastMessage.create({
                groupId:data.groupId,
                senderId:data.senderId,
                msgId:data.msgId,
                message:data.message,
                messageType:data.messageType,
                filename:data?.filename,
                orignalname:data?.orignalname,
                mimetype:data?.mimetype,
            });
            if(!create){
                throw new Error("last message store failed");
            }
             for(let i=0;i<group.peoplesId.length;i++){
                const id=group.peoplesId[i].toString();
                const receiverSocketId=users[id];
                if(receiverSocketId){
                    io.to(receiverSocketId).emit("group_chat_list_update",(create));
                }
                if(id!==data.senderId.toString()){
                    await emitPendingCountToUser(id, io, users);
                }
            }
        }
    }catch(err){
        throw err;
    }
}


//delete for evryone 
export const update_group_chatlist_delete=async(data:
    {_id:string,senderId:string},
    socket:Socket,io:Server,
    users:{[key:string]:string},
    group:IGroupMessage
)=>{
    try{
        const lastMessage=await groupMessage.findOne({groupId:data._id,messageType:{$ne:"system"}}).sort({createdAt:-1});
        const chatlistLastMessage=await groupLastMessage.findOne({groupId:data._id});
        if(!chatlistLastMessage){
            return;
        }
        if(lastMessage){
            chatlistLastMessage.groupId=lastMessage.groupId;
            chatlistLastMessage.senderId=new mongoose.Types.ObjectId(lastMessage.senderId);
            chatlistLastMessage.msgId=lastMessage._id;
            chatlistLastMessage.message=lastMessage.message;
            chatlistLastMessage.messageType=lastMessage.messageType;
            chatlistLastMessage.orignalname=lastMessage?.orignalname;
            chatlistLastMessage.filename=lastMessage?.filename;
            chatlistLastMessage.mimetype=lastMessage?.mimetype;
            await chatlistLastMessage.save();

            const totalPendingMessage=await allPendingMessage(data.senderId,socket);
            for(let i=0;i<group.peoplesId.length;i++){
                const id=group.peoplesId[i].toString();
                const receiverSocketId=users[id];
                if(id===data.senderId.toString())continue;
                if(receiverSocketId){
                    io.to(receiverSocketId).emit("group_chat_list_update",(chatlistLastMessage));
                    await emitPendingCountToUser(id, io, users);
                }
            }
            socket.emit("group_chat_list_messgae",(chatlistLastMessage));
            socket.emit("totalPendingMessage",(totalPendingMessage));
        }
    }catch(err){
        throw err;
    }
}


//edit message
export const updateGroupChatListEdit=async(data:
    {_id:string,msgId:string,senderId:string},
    socket:Socket,io:Server,
    users:{[key:string]:string},
    group:IGroupMessage
)=>{
    try{
        const lastMessage=await groupMessage.findOne({groupId:data._id,messageType:{$ne:"system"}}).sort({createdAt:-1});
        const chatlistLastMessage=await groupLastMessage.findOne({groupId:data._id});
        if(!chatlistLastMessage){
            return;
        }
        if(lastMessage){
            if(lastMessage._id.toString()!==data._id.toString())return;
            chatlistLastMessage.groupId=lastMessage.groupId;
            chatlistLastMessage.senderId=new mongoose.Types.ObjectId(lastMessage.senderId);
            chatlistLastMessage.msgId=lastMessage._id;
            chatlistLastMessage.message=lastMessage.message;
            chatlistLastMessage.messageType=lastMessage.messageType;
            chatlistLastMessage.orignalname=lastMessage?.orignalname;
            chatlistLastMessage.filename=lastMessage?.filename;
            chatlistLastMessage.mimetype=lastMessage?.mimetype;
            await chatlistLastMessage.save();
        }
        for(let i=0;i<group.peoplesId.length;i++){
            const id=group.peoplesId[i].toString();
            const receiverSocketId=users[id];
            if(id===data.senderId)continue;
            if(receiverSocketId){
                io.to(receiverSocketId).emit("group_chat_list_update",(chatlistLastMessage));
            }
        }
        socket.emit("group_chat_list_update",(chatlistLastMessage));
    }catch(err){
        throw err;
    }
}


//user joined group last messages
export const allGroupsUserJoined=async(senderId:string,socket:Socket)=>{
    try{
        let response=[];
        const groups=await groupChatModel.find({peoplesId:senderId});
        for(let i=0;i<groups.length;i++){
            const groupId=groups[i]._id.toString();
            const lastMessageOfGroup=await groupLastMessage.findOne({groupId:groupId});
            if(lastMessageOfGroup){
                response.push({groupId,lastMessageOfGroup});
            }
        }
        socket.emit("allLastMessageOfGroups",(response));
    }catch(err){
        throw err;
    }
}