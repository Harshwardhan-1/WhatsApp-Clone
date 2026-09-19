import {Socket,Server} from 'socket.io';
import { callChat } from '../models/InCallChat.model';
import type { 
    createCallMsg,
    deleteCallMsg,
    updateCallMsg,
    toggleLikeType,groupCallReply
} from '../types/InCallChat.types';
import { groupChatModel } from '../models/group.create.model';
import mongoose from 'mongoose';


export const createMsg=async(data:createCallMsg,
    socket:Socket,io:Server,
    users:{[key:string]:string},
    activeGroupChats:Record<string,string>
)=>{
    try{
        const group=await groupChatModel.findById(data.groupId);
        if(!group){
            throw new Error("group not found");
        }
        const IsMember=group.peoplesId.some(
            (id)=>id.toString()===data.senderId.toString()
        );
        const IsAdmin=group.admin.some(
            (id)=>id.toString()===data.senderId.toString()
        );
        if(!IsMember && !IsAdmin){
            throw new Error("you can't send message because you are no longer member");
        }
        if(group.callStatus==="free"){
            throw new Error("call is over you can't send message to it anymore");
        }
        
        const create=await callChat.create({
            callId:data.callId,
            groupId:data.groupId,
            message:data.message,
            senderId:data.senderId,
    });
    if(!create){
        throw new Error("failed to send message");
    }
    const members=Array.from(new Set([
        ...group.peoplesId.map((p)=>p.toString()),
        ...group.admin.map((a)=>a.toString())
    ]));

    for(let i=0;i<members.length;i++){
        const id=members[i].toString();
        if(id===data.senderId.toString())continue;
        const receiverSocketId=users[id];
        if(receiverSocketId){
            io.to(receiverSocketId).emit("incallchatmsg",(create));
        }
    }
    socket.emit("incallchatmsg",(create));
    create.viewedBy.push(new mongoose.Types.ObjectId(data.senderId));
    await create.save();
    }catch(err){
        throw err;
    }
}               









export const deleteMsg=async(
    data:deleteCallMsg,
    socket:Socket,io:Server,
    users:{[key:string]:string},activeGroupChats:Record<string,string>
)=>{
    try{
        const [group,call]=await Promise.all([
            groupChatModel.findById(data.groupId),
            callChat.findById(data.msgId),
        ]);
        if(!group){
            throw new Error("group not found");
        }
        const isMember=group.peoplesId.some(
            (id)=>id.toString()===data.senderId.toString()
        );
        const isAdmin=group.admin.some(
         (id)=>id.toString()===data.senderId.toString()
        );
        if(!isMember && !isAdmin){
            throw new Error("you are not a member anymore");
        }
        if(group.callStatus==="free"){
            throw new Error("call is over can't delete this message");
        }
        if(!call){
            throw new Error("callMsg not found");
        }
        if(call.senderId.toString()!==data.senderId.toString()){
            throw new Error("don't have access to delete this message");
        }
        call.message="This Message Was Deleted";
        await call.save();

        const members=Array.from(new Set([
            ...group.peoplesId.map((p)=>p.toString()),
            ...group.admin.map((a)=>a.toString())
        ]));
        
        for(let i=0;i<members.length;i++){
            const id=members[i].toString();
            if(id===data.senderId.toString())continue;
            const receiverSocketId=users[id];
            if(receiverSocketId){
                io.to(receiverSocketId).emit("callMsgDeleted",(
                    {groupId:data.groupId,msgId:data.msgId,message:call.message}
                ));
            }
        }
        socket.emit("callMsgDeleted",(
            {groupId:data.groupId,msgId:data.msgId,message:call.message}
        ));
    }catch(err){
        throw err;
    }
}














export const updateMsg=async(data:updateCallMsg,
    socket:Socket,io:Server,
    users:{[key:string]:string},
    activeGroupChats:Record<string,string>
)=>{
    try{
        const [group,msg]=await Promise.all([
            groupChatModel.findById(data.groupId),
            callChat.findById(data.msgId)
        ]);
        if(!group){
            throw new Error("group not found");
        }
        //check still  a member or not
        const isMember=group.peoplesId.some(
            (id)=>id.toString()===data.senderId.toString()
        );
        const isAdmin=group.admin.some(
            (id)=>id.toString()===data.senderId.toString()
        );
        if(!isMember && !isAdmin){
            throw new Error("you can't send or update Msg because you are no longer member");
        }
        if(group.callStatus==="free"){
            throw new Error("you can't update msg because call is over now");
        }
        if(!msg){
            throw new Error("msg not found");
        }
        if(msg.senderId.toString()!==data.senderId.toString()){
            throw new Error("you don't have access to update this Msg");
        }
        msg.message=data.message;
        await msg.save();
        
        const members=Array.from(new Set([
            ...group.peoplesId.map(p=>p.toString()),
            ...group.admin.map(a=>a.toString())
        ]));

        for(let i=0;i<members.length;i++){
            const id=members[i].toString();
            if(id===data.senderId.toString())continue;
            const receiverSocketId=users[id];
            if(receiverSocketId){
                io.to(receiverSocketId).emit("group_call_message_update",(data));
            }
        }
        socket.emit("group_call_message_update",(data));
    }catch(err){
        throw err;
    }
}













export const toggleLike=async(data:toggleLikeType,
    socket:Socket,io:Server,
    users:{[key:string]:string},
    activeGroupChats:Record<string,string>
)=>{
    try{
      const [group,call]=await Promise.all([
        groupChatModel.findById(data.groupId),
        callChat.findById(data.msgId)
      ]);
      if(!group){
        throw new Error("group not found");
      }
      if(group.callStatus==="free"){
        throw new Error("call is over you can't react on this any more");
      }
      if(!call){
        throw new Error("call msg not found");
      }
      const alreadyLike=call.toggleLike.some(
        (id)=>id.toString()===data.senderId.toString()
      );
      if(alreadyLike){
        call.toggleLike=call.toggleLike.filter(
            (id)=>id.toString()!==data.senderId.toString()  
        );
      }else{
        call.toggleLike.push(new mongoose.Types.ObjectId(data.senderId));
      }
      await call.save();
      const length=call.toggleLike.length;
      const members=Array.from(new Set([
        ...group.peoplesId.map(p=>p.toString()),
        ...group.admin.map(a=>a.toString())
      ]));
      const msgCreatorId=call.senderId.toString();
      const populateData=await call.populate("toggleLike","name username");
      
      for(let i=0;i<members.length;i++){
        const id=members[i];
        if(id==data.senderId.toString())continue;
        const receiverSocketId=users[id];
        if(receiverSocketId){
            io.to(receiverSocketId).emit("group_call_toggle_update",(
                {groupId:data.groupId,msgId:data.msgId,senderId:data.senderId,msgCreatorId,length,populateData}
            ))
        }
      }
      socket.emit("group_call_toggle_update",(
         {groupId:data.groupId,msgId:data.msgId,senderId:data.senderId,msgCreatorId,length,populateData}
      ));
    }catch(err){
        throw err;
    }
}










export const reply=async(data:groupCallReply,
    socket:Socket,io:Server,
    users:{[key:string]:string},
)=>{
    try{
        const group=await groupChatModel.findById(data.groupId);
        if(!group){
            throw new Error("group not found");
        }
        if(group.callStatus==="free"){
            throw new Error("cannot reply because call is over");
        }
        const id=new mongoose.Types.ObjectId(data.parentId.parentId);
        const create=await callChat.create({
            callId:data.callId,
            groupId:data.groupId,
            message:data.message,
            senderId:new mongoose.Types.ObjectId(data.senderId),
            parentReply:[
            {
                parentId:id,
                message:data.message,
                senderId:data.senderId,
            }
        ],
        });
        if(!create){
            throw new Error("failed to send reply");
        }
        const members=Array.from(new Set([
            ...group.peoplesId.map(p=>p.toString()),
            ...group.admin.map(a=>a.toString())
        ]));

        for(let i=0;i<members.length;i++){
            const id=members[i].toString();
            if(id===data.senderId.toString())continue;
            const receiverSocketId=users[id];
            if(receiverSocketId){
                io.to(receiverSocketId).emit("group_call_reply",({data,create}));
            }
        }
        socket.emit("group_call_reply",({data,create}));
    }catch(err){
        throw err;
    }
} 





//here we push it in viewed by when user open group call chat page
export const viewed=async(data:{groupId:string,callId:string,senderId:string})=>{
    try{
        const group=await groupChatModel.findById(data.groupId);
        if(!group){
            throw new Error("group not found");
        }
        const call=await callChat.find({callId:data.callId});
        for(let i=0;i<call.length;i++){
            //here we check first if it is not in viewed by we will push it
            const isInViewed=call[i].viewedBy.some(
                (id)=>id.toString()===data.senderId.toString()
            );
            if(!isInViewed){
                call[i].viewedBy.push(new mongoose.Types.ObjectId(data.senderId));
                await call[i].save();
            }
        }        
    }catch(err){
        throw err;
    }
}









//here we will give all the views of peoples who sees that message
export const getAllViewed=async(data:{groupId:string,msgId:string,senderId:string},socket:Socket)=>{
    try{
        const group=await groupChatModel.findById(data.groupId);
        if(!group){
            throw new Error("group not found");
        }
        const msg=await callChat.findById(data.msgId);
        if(!msg){
            throw new Error("msg not found");
        }
        if(msg.senderId.toString()!==data.senderId.toString()){
            throw new Error("don't have access to view this");
        }
        await msg.populate("viewedBy","name username");
        socket.emit("group_call_msg_viewedBy",(msg));
    }catch(err){
        throw err;
    }
}












export const allMessages=async(data:{groupId:string,callId:string},socket:Socket)=>{
    try{
        const group=await groupChatModel.findById(data.groupId);
        if(!group){
            throw new Error("group not found");
        }
        const allMsg=await callChat.find({callId:data.callId}).sort({createdAt:1});
        socket.emit("groupCall_all_messages",(allMsg));
    }catch(err){
        throw err;
    }
}








export const reaction=async(data:
    {groupId:string,msgId:string,senderId:string,emoji:string},
    socket:Socket,io:Server,
    users:{[key:string]:string},
)=>{
    try{
        const [group,msg]=await Promise.all([
            groupChatModel.findById(data.groupId),
            callChat.findById(data.msgId) 
        ]);
        if(!group){
           throw new Error("group not found");
        }
        if(group.callStatus==="free"){
            throw new Error("cannot make reaction because call is over");
        }
        if(!msg){
            throw new Error("msg not found");
        }
        const checkReaction=msg.reaction.find(
            (id)=>id.userId.toString()===data.senderId.toString()  
        );
        if(!checkReaction){
            msg.reaction.push({userId:new mongoose.Types.ObjectId(data.senderId),emoji:data.emoji});
        }else{
            //first we check is it is the same reaction then we remove it
            if(checkReaction.emoji===data.emoji){
                msg.reaction=msg.reaction.filter(
                    (id)=>id._id!.toString()!==checkReaction._id!.toString()
                );
            }else{
                checkReaction.emoji=data.emoji;
            }
        }
        await msg.save();
        const members=Array.from(new Set([
            ...group.peoplesId.map(p=>p.toString()),
            ...group.admin.map(a=>a.toString())
        ]));

        for(let i=0;i<members.length;i++){
            const id=members[i].toString();
            if(id===data.senderId.toString())continue;
            const receiverSocketId=users[id];
            if(receiverSocketId){
                io.to(receiverSocketId).emit("groupCallReactionUpdate",(msg));
            }
        }
        socket.emit("groupCallReactionUpdate",(msg));    
    }catch(err){
        throw err;
    }
}