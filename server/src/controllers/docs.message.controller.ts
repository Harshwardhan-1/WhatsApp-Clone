import {Socket,Server} from 'socket.io';
import mongoose from 'mongoose';
import { docs } from '../models/docs.model';
import type { DocsMessage,DeleteDocsMsg,ParentReply } from "../types/docs.message.types";
import { docsMessage } from '../models/docs.message.model';





export const createDocsMsg=async(data:DocsMessage,
    socket:Socket,io:Server,
    users:{[key:string]:string},
    activeDocs:Record<string,string>
)=>{
    try{
        const d=await docs.findById(data.docsId);
        if(!d){
            throw new Error("docs not found");
        }
        //we check if it is the member or not
        const isMember=
        d.editPermission.some((id)=>id.toString()===data.senderId.toString())  ||
        d.viewPermission.some((id)=>id.toString()===data.senderId.toString())   
        if(!isMember){
            throw new Error("don't have access to send message in this doc's chat");
        }
        const create=await docsMessage.create({
            docsId:data.docsId,
            senderId:data.senderId,
            message:data.message,
        });
        if(!create){
            throw new Error("failed to create Msg");
        }
        create.viewedBy.push(new mongoose.Types.ObjectId(data.senderId));
        const members=Array.from(new Set([
            ...d.editPermission.map((id)=>id.toString()),
            ...d.viewPermission.map((id)=>id.toString())
        ]));


        for(let i=0;i<members.length;i++){
            const id=members[i].toString();
            if(id===data.senderId)continue;
            const receiverSocketId=users[id];

            if(receiverSocketId && activeDocs[id]===data.docsId){
                io.to(receiverSocketId).emit("docs_message",({data,create}));
            }
        }
        await create.save();
        socket.emit("docs_message",({data,create}));
    }catch(err){
        throw err;
    }
}












export const deleteMsg=async(data:DeleteDocsMsg,
    socket:Socket,io:Server,
    users:{[key:string]:string},
    activeDocs:Record<string,string>
)=>{
    try{
        const [d,msg]=await Promise.all([
            docs.findById(data.docsId),
            docsMessage.findById(data.msgId)
        ]);
        if(!d){
            throw new Error("docs not found");
        }
        if(!msg){
            throw new Error("msg not found");
        }
        if(msg.senderId.toString()!==data.senderId.toString()){
            throw new Error("don't have access to delete this msg");
        }
        msg.message="This Message Is Deleted";
        await msg.save();
         const members=Array.from(new Set([
            ...d.editPermission.map((id)=>id.toString()),
            ...d.viewPermission.map((id)=>id.toString())
        ]));


        for(let i=0;i<members.length;i++){
            const id=members[i].toString();
            if(id===data.senderId)continue;
            const receiverSocketId=users[id];

            if(receiverSocketId && activeDocs[id]===data.docsId){
                io.to(receiverSocketId).emit("docs_message_deleted",(
                    {docsId:data.docsId,msgId:data.msgId,msg:msg.message}
                ));
            }
        }
        socket.emit("docs_message_deleted",( {docsId:data.docsId,msgId:data.msgId,msg:msg.message}));
    }catch(err){
        throw err;
    }
}














export const updateMsg=async(data:
    {docsId:string,msgId:string,senderId:string,message:string},
    socket:Socket,io:Server,
    users:{[key:string]:string},activeDocs:Record<string,string>
)=>{
    try{
        const [d,msg]=await Promise.all([
            docs.findById(data.docsId),
            docsMessage.findById(data.msgId)
        ]);
        if(!d){
            throw new Error('docs not found');
        }
        if(!msg){
            throw new Error("msg not found");
        }
        if(msg.senderId.toString()!==data.senderId.toString()){
            throw new Error("don't have access to update this msg");
        }
        msg.message=data.message;
        await msg.save();

        const members=Array.from(new Set([
            ...d.editPermission.map((id)=>id.toString()),
            ...d.viewPermission.map((id)=>id.toString())
        ]));

        for(let i=0;i<members.length;i++){
            const id=members[i].toString();
            const receiverSocketId=users[id];
            if(id===data.senderId.toString())continue;
            if(receiverSocketId && activeDocs[id]===data.docsId){
                io.to(receiverSocketId).emit("docs_message_updated",(data));
            }
        }
        socket.emit("docs_message_updated",(data));
    }catch(err){
        throw err;
    }
}













export const toggleLike=async(data:
    {docsId:string,senderId:string,msgId:string},
    socket:Socket,io:Server,
    users:{[key:string]:string},
    activeDocs:Record<string,string>
)=>{
    try{
        const [d,msg]=await Promise.all([
            docs.findById(data.docsId),
            docsMessage.findById(data.msgId),
        ]);
        if(!d){
            throw new Error("docs not found");
        }
        if(!msg){
            throw new Error("msg not found");
        }
        const alreadyLike=msg.toggleLike.some(
            (id)=>id.toString()===data.senderId.toString()
        );
        if(alreadyLike){
            msg.toggleLike=msg.toggleLike.filter(
                (id)=>id.toString()!==data.senderId.toString()
            );
        }else{
            msg.toggleLike.push(new mongoose.Types.ObjectId(data.senderId));
        }
        await msg.save();
        
        const length=msg.toggleLike.length;

           const members=Array.from(new Set([
            ...d.editPermission.map((id)=>id.toString()),
            ...d.viewPermission.map((id)=>id.toString())
        ]));

        for(let i=0;i<members.length;i++){
            const id=members[i].toString();
            const receiverSocketId=users[id];
            if(id===data.senderId.toString())continue;
            if(receiverSocketId && activeDocs[id]===data.docsId){
                io.to(receiverSocketId).emit("toggle_docs_msg",({data,length}));
            }
        }
        socket.emit("toggle_docs_msg",({data,length}));
    }catch(err){
        throw err;
    }
}











export const docsReaction=async(data:
    {docsId:string,msgId:string,senderId:string,emoji:string},
    socket:Socket,io:Server,
    users:{[key:string]:string},
    activeDocs:Record<string,string>
)=>{
    try{
        const [d,msg]=await Promise.all([
            docs.findById(data.docsId),
            docsMessage.findById(data.msgId),
        ]);
        if(!d){
            throw new Error("docs not found");
        }
        if(!msg){
            throw new Error("msg not found");
        }
        const checkReaction=msg.reaction.find(
            (id)=>id.userId.toString()===data.senderId.toString()
        );
        if(checkReaction){
            if(checkReaction.emoji===data.emoji){
                msg.reaction=msg.reaction.filter(
                    (id)=>id._id!.toString()!==checkReaction._id!.toString()
                );
            }else{
                checkReaction.emoji=data.emoji;
            }
        }else{
            const id=new mongoose.Types.ObjectId(data.senderId);
            msg.reaction.push({userId:id,emoji:data.emoji});
        }
        await msg.save();

          const members=Array.from(new Set([
            ...d.editPermission.map((id)=>id.toString()),
            ...d.viewPermission.map((id)=>id.toString())
        ]));

        for(let i=0;i<members.length;i++){
            const id=members[i].toString();
            const receiverSocketId=users[id];
            if(id===data.senderId.toString())continue;
            if(receiverSocketId && activeDocs[id]===data.docsId){
                io.to(receiverSocketId).emit("docs_msg_reaction",({data,msg}));
            }
        }
        socket.emit("docs_msg_reaction",({data,msg}));
    }catch(err){
        throw err;
    }
}











//we will not show user option at frontend to reply on this 
//if it is deleted or mark this message is deleted

export const parentReply=async(data:ParentReply,
    socket:Socket,io:Server,
    users:{[key:string]:string},
    activeDocs:Record<string,string>
)=>{
    try{
        const d=await docs.findById(data.docsId);
        if(!d){
            throw new Error("docs not found");
        }
        const create=await docsMessage.create({
            docsId:data.docsId,
            senderId:data.senderId,
            message:data.message,
            reply:[
            {
                parentId:data.parentData.parentId,
                senderId:data.senderId,
                message:data.message,
            },
        ],
        });
        if(!create){
            throw new Error("failed to create message");
        }
        const members=Array.from(new Set([
            ...d.editPermission.map((id)=>id.toString()),
            ...d.viewPermission.map((id)=>id.toString())
        ]));

        for(let i=0;i<members.length;i++){
            const id=members[i].toString();
            if(id===data.senderId.toString())continue;
            const receiverSocketId=users[id];
            if(receiverSocketId && activeDocs[id]===data.docsId){
                io.to(receiverSocketId).emit("docs_parent_reply",({data,create}));
            }
        }
        socket.emit("docs_parent_reply",({data,create}));
    }catch(err){
        throw err;
    }
}










export const allMsg=async(data:{docsId:string},socket:Socket)=>{
    try{
        const d=await docs.findById(data.docsId);
        if(!d){
            throw new Error("docs not found");
        }
        const msg=await docsMessage.find({docsId:data.docsId}).sort({createdAt:1});
        socket.emit("all_docs_message",({docsId:data.docsId,msg}));
    }catch(err){
        throw err;
    }
};











export const viewed=async(data:{senderId:string,docsId:string},)=>{
    try{
        const d=await docs.findById(data.docsId);
        if(!d){
            throw new Error("docs not found");
        }
        const msg=await docsMessage.find({docsId:data.docsId});
        for(let i=0;i<msg.length;i++){
            const check=msg[i].viewedBy.some(
                (id)=>id.toString()===data.senderId.toString()
            );
            if(!check){
                msg[i].viewedBy.push(new mongoose.Types.ObjectId(data.senderId));
                await msg[i].save();
            }
        }
    }catch(err){
        throw err;
    }
}











export const getAllViewed=async(data:{docsId:string,msgId:string,senderId:string},socket:Socket)=>{
    try{
        const [d,msg]=await Promise.all([
            docs.findById(data.docsId),
            docsMessage.findById(data.msgId)
        ]);
        if(!d){
            throw new Error("docs not found");
        }
        if(!msg){
            throw new Error("message not found");
        }
        if(msg.senderId.toString()!==data.senderId.toString()){
            throw new Error("msg not found");
        }
        await msg.populate("viewedBy","name avatar");
        socket.emit("docs_viewedBy_data",(msg));
    }catch(err){
        throw err;
    }
}