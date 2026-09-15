import mongoose from 'mongoose';
import {Socket,Server} from 'socket.io';
import { communityMsg } from '../models/community.message.model';
import { community } from '../models/community.chat.model';
import type {communityMsgType} from "../types/community.types";



//create


export const createMsg=async(data:communityMsgType,
    socket:Socket,io:Server,
    users:{[key:string]:string},
    communityRecord:Record<string,string>
)=>{
    try{
        const c=await community.findById(data.communityId);
        if(!c){
            throw new Error("community not found");
        }
        const now=Date.now();
        if(now>=c.expiresAt.getTime()){
            throw new Error("cannot send message as it is")
        }
        const create=await communityMsg.create({
            communityId:data.communityId,
            senderId:data.senderId,
            message:data.message,
            messageType:data.messageType as "text" | "file" | "system",
            mimetype:data?.mimetype,
            orignalname:data?.orignalname,
            expiresAt:new Date(Date.now()+24*60*60*1000)
        });
        if(!create){
            throw new Error("fail to create Msg");
        }

        //sabhi online members ko hamesha deliver karo - "active chat" tracking sirf
        //extra features (jaise seen) ke liye hai, message delivery ke liye nahi.
        //frontend khud check kar leta hai ki abhi konsi community khuli hai.
        for(let i=0;i<c.members.length;i++){
            const id=c.members[i].toString();
            if(id===data.senderId.toString())continue;
            const receiverSocketId=users[id];
            if(receiverSocketId){
                io.to(receiverSocketId).emit("receive_community_message",(create));
            }
        }
        socket.emit("receive_community_message",(create));
    }catch(err){
        throw err;
    }
}










//delete msg


export const deleteMsg=async(data:{communityId:string,senderId:string,msgId:string},
    socket:Socket,io:Server,
    users:{[key:string]:string},
    activeRecord:Record<string,string>
)=>{
    try{
        const [c,msg]=await Promise.all([
            community.findById(data.communityId),
            communityMsg.findById(data.msgId), 
        ]);
        if(!c){
            throw new Error("community not found");
        }
        const now=Date.now();
        if(now>=c.expiresAt.getTime()){
            throw new Error("community doesn't exist");
        }
        if(!msg){
            throw new Error("msg not found");
        }
        if(msg.senderId!==data.senderId){
            throw new Error("don't have access to delete the message");
        }
        await msg.deleteOne();
        for(let i=0;i<c.members.length;i++){
            const id=c.members[i].toString();
            if(id===data.senderId)continue;
            const receiverSocketId=users[id];
            if(receiverSocketId){
                io.to(receiverSocketId).emit("community_msg_deleted",(data));
            }
        }
        socket.emit("community_msg_deleted",(data));
    }catch(err){
        throw err;
    }
}









export const updateMsg=async(data:
    {communityId:string,senderId:string,msgId:string,message:string},
    socket:Socket,io:Server,
    users:{[key:string]:string},communityRecord:Record<string,string>
)=>{
    try{
        const [c,msg]=await Promise.all([
            community.findById(data.communityId),
            communityMsg.findById(data.msgId)
        ]);
        const now=Date.now();
        if(!c || now>=c.expiresAt.getTime()){
            throw new Error("community not found");
        }
        if(!msg){
            throw new Error("msg not found");
        }
        if(msg.senderId.toString()!==data.senderId.toString()){
            throw new Error("msg not found");
        }
        msg.message=data.message;
        msg.isEdited=true;
        await msg.save();
        for(let i=0;i<c.members.length;i++){
            const id=c.members[i].toString();
            if(id===data.senderId)continue;
            const receiverSocketId=users[id];
            if(receiverSocketId){
                io.to(receiverSocketId).emit("communityMsgUpdated",(msg));
            }
        }
        socket.emit("communityMsgUpdated",(msg));
    }catch(err){
        throw err;
    }
}










export const showMsg=async(data:{communityId:string,senderId:string},socket:Socket)=>{
    try{
        const c=await community.findById(data.communityId);
        if(!c){
            throw new Error("community not found");
        }
        const now=Date.now();
        if(now>=c.expiresAt.getTime()){
            throw new Error("this community no longer exist");
        }
        //here we will check the joining time and at which time user join we will show only
        //those message from after it

        const t=c.joinTime.find(
            (id)=>id.userId.toString()===data.senderId.toString()
        );
        if(!t){
            throw new Error("join the community again");
        }
        const time=t.date;

        const findMsg=await communityMsg.find(
        {communityId:data.communityId,createdAt:{$gt:time}}).sort({createdAt:1});
        if(findMsg.length===0){
            return;
        }
        socket.emit("prev_community_message",(findMsg));
    }catch(err){
        throw err;
    }
}












export const handleEmoji=async(data:
    {communityId:string,msgId:string,senderId:string,emoji:string},
    socket:Socket,io:Server,users:{[key:string]:string},
    communityRecord:Record<string,string>
)=>{
    try{
        const c=await community.findById(data.communityId);
        const now=Date.now();
        if(!c || now>=c.expiresAt.getTime()){
            throw new Error("community not found");
        }
        const m=await communityMsg.findById(data.msgId);
        if(!m){
            throw new Error("msg not found");
        }
        //we first check if it is the same emoji that user already have then we remove it 
        const findIt=m.reaction.find(
            (id)=>id?.userId!.toString()===data.senderId.toString()
        );
        if(findIt){
            if(findIt.emoji===data.emoji){
                m.reaction.pull({_id:findIt._id});
            }else{
                findIt.emoji=data.emoji;
            }
        }else{
            const userId=new mongoose.Types.ObjectId(data.senderId);
            m.reaction.push({userId,emoji:data.emoji});
        }
        await m.save();
        for(let i=0;i<c.members.length;i++){
            const id=c.members[i].toString();
            if(id===data.senderId.toString())continue;
            const receiverSocketId=users[id];
            if(receiverSocketId){
                io.to(receiverSocketId).emit("community_emoji_updated",(m));
            }
        }
        socket.emit("community_emoji_updated",(m));
    }catch(err){
        throw err;
    }
}










export const groupEmoji=async(data:{communityId:string,senderId:string,msgId:string},socket:Socket)=>{
    try{
        const c=await community.findById(data.communityId);
        if(!c || Date.now()>=c.expiresAt.getTime()){
            throw new Error("community not found");
        }
        const m=await communityMsg.findById(data.msgId);
        if(!m){
            throw new Error("msg not found");
        }
        const map:Record<string,{emoji:string,count:number}>={};
        for(let i=0;i<m.reaction.length;i++){
            const {emoji}=m.reaction[i];
            if(!emoji)continue;
            if(!map[emoji]){
                map[emoji]={emoji,count:1};
            }else{
                map[emoji].count++;
            }
        }
        const react=Object.values(map);
        socket.emit("community_group_emoji",({msgId:data.msgId,react}));
    }catch(err){
        throw err;
    }
}