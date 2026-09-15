import mongoose from 'mongoose';
import {Socket,Server} from 'socket.io';
import { storeGroupLastMessage } from './group.lastMessage.controller';
import { groupMessage } from '../models/group.message.model';
import { groupChatModel } from '../models/group.create.model';
import { groupCallCreatedType } from '../types/group.call.types';
import { emitMessageInGroup } from './group.message.controller';
import { createLiveKitToken } from '../utils/liveKitToken';



//user click on create group call

export const groupCall=async(data:groupCallCreatedType,
    socket:Socket,io:Server,
    users:{[key:string]:string},
    activeGroupChats:Record<string,string>
)=>{
    try{
        const g=await groupChatModel.findById(data.groupId);
        if(!g){
            throw new Error("group not exist");
        }
        //first check if a admin chooses only admin can send message then no video call is 
        //possible by this user
        if(g.onlyAdminSendMessage){
            //here we check if this person is admin or not
            const isAdmin=g.admin.some(
                (id)=>id.toString()===data.senderId.toString()
            );
            if(!isAdmin){
                throw new Error("you can't make video call because admin has closed that option");
            }
        }

        //now we check if the person is currently the member of group or not

        const isMember=g.peoplesId.some(
            (id)=>id.toString()===data.senderId.toString()
        );
        const isAdmin=g.admin.some(
            (id)=>id.toString()===data.senderId.toString()
        )
        if(!isMember && !isAdmin){
            throw new Error(`you can't make ${data.messageType} because you are no longer member`);
        }

        if(g.callStatus==="busy"){
            throw new Error("already call is going wait for some time");
        }


        //check that some other person doesn't again call when the call is on going

        const create=await groupMessage.create({
            groupId:data.groupId,
            senderId:data.senderId,
            message:`${data.messageType}`,
            messageType:"call",
        });
        if(!create){
            throw new Error("failed to create Msg");
        }

        g.callStatus="busy";
        await g.save();


       

        await storeGroupLastMessage({
            groupId:data.groupId,
            senderId:data.senderId,
            msgId:create._id.toString(),
            message:create.message,
            messageType:create.messageType,
            orignalname:create?.orignalname,
            filename:create?.filename,
            mimetype:create?.mimetype,
        },g);
        await emitMessageInGroup({_id:data.groupId,senderId:data.senderId},create,users,activeGroupChats,socket,io);



        //now we check if it is online or offline and give data to frontend based on that


        for(let i=0;i<data.receiverId.length;i++){
            const id=data.receiverId[i].toString();
            let isEngage="not engaged"
            if(id===data.senderId.toString())continue;
            const receiverSocketId=users[id];

            //check if a person is not on another call

            //find all groups in which user is involved and it is call message

            const findAllGroups=await groupChatModel.find({
                $or:[
                    {peoplesId:id},
                    {admin:id},
                ],
            });

            //now we will check that all the message of messageType call message 
            //and check is the user is 

            for(let i=0;i<findAllGroups.length;i++){
                const groupId=findAllGroups[i]._id.toString();
                const allMsg=await groupMessage.find({groupId:groupId,messageType:"call"});
                if(allMsg.length===0)continue;

                for(let i=0;i<allMsg.length;i++){
                    //here we check that person is not engage on another call
                    const check=allMsg[i].callStatus!.some(
                        (msgId)=>msgId.userId.toString()===id.toString() && msgId.status==="ongoing"
                    );
                    if(check){
                        isEngage="engaged";
                        break;
                    }
                }
                if(isEngage==="engaged"){
                    break;
                }
            }



            if(receiverSocketId && isEngage==="not engaged"){
                //from frontend we will call accepted for it and then join them at accepted function
                create.callStatus!.push({userId:new mongoose.Types.ObjectId(id),status:"ongoing"});
                io.to(receiverSocketId).emit("user_available_for_call",(
                    {groupId:data.groupId,senderId:data.senderId,receiverId:id}
                ));
            }
        }
        await create.save();
        socket.emit("user_available_for_call",({groupId:data.groupId,senderId:data.senderId,receiverId:data.senderId}));
        const LiveKitData=await createLiveKitToken(data.senderId,data.groupId);
        socket.emit("user_accepted_group_call",({groupId:data.groupId,senderId:data.senderId,LiveKitData}))
    }catch(err){
        throw err;
    }
}












//reject call

//senderId is the person who calls and receiverId is the person who cancels the calls
//we will also send msgId that is easier for us to determine message

export const callRejected=async(data:
    {groupId:string,senderId:string,receiverId:string,msgId:string},
    socket:Socket,io:Server,users:{[key:string]:string}
)=>{
    try{
        const [group,msg]=await Promise.all([
            groupChatModel.findById(data.groupId),
            groupMessage.findById(data.msgId)
        ]);
        if(!group){
            throw new Error("group not found");
        }
        if(!msg){
            throw new Error("message not found");
        }
        msg.callStatus=msg.callStatus!.filter(
            (id)=>id.userId.toString()!==data.receiverId.toString()
        );
        if(msg.callStatus.length===0){
            group.callStatus="free";
        }
        await group.save();
        await msg.save();

        const senderSocketId=users[data.senderId];
        if(senderSocketId){
            io.to(senderSocketId).emit("group_call_rejected",(data));
        }
        socket.emit("group_call_rejected",(data));
    }catch(err){
        throw err;
    }
}










//call accepted 
//jisna call accept kiya ha wo ha senderId 
export const callAccepted=async(data:{groupId:string,senderId:string},
    socket:Socket,io:Server,
    users:{[key:string]:string},
)=>{
    try{
        const group=await groupChatModel.findById(data.groupId);
        if(!group){
            throw new Error("group not found");
        }
        //sender id is the person who accepts the call
        for(let i=0;i<group.peoplesId.length;i++){
            const id=group.peoplesId[i].toString();
            const liveKitData=await createLiveKitToken(id,data.groupId);
            const receiverSocketId=users[id];
            if(receiverSocketId){
                io.to(receiverSocketId).emit("new_member_added_in_groupCall",(
                    {groupId:data.groupId,userId:id,newMemberId:data.senderId,liveKitData}
                ));
            }
        }
        for(let i=0;i<group.admin.length;i++){
            const id=group.admin[i].toString();
            const receiverSocketId=users[id];
            if(receiverSocketId){
                const liveKitData=await createLiveKitToken(id,data.groupId);
                io.to(receiverSocketId).emit("new_member_added_in_groupCall",(
                    {groupId:data.groupId,userId:id,newMemberId:data.senderId,liveKitData}
                ));
            }
        }
    }catch(err){
        throw err;
    }
}












//leave group call

export const leaveGroupCall=async(data:
    {groupId:string,senderId:string,msgId:string},
    socket:Socket,io:Server,
    users:{[key:string]:string}
)=>{
    try{
        const [group,msg]=await Promise.all([
            groupChatModel.findById(data.groupId),
            groupMessage.findById(data.msgId)
        ]);
        if(!group){
            throw new Error("group not found");
        }
        if(!msg){
            throw new Error("message not exist");
        }
        msg.callStatus=msg.callStatus!.filter(
            (id)=>id.userId.toString()!==data.senderId.toString()
        );
        if(msg.callStatus.length===0){
            group.callStatus="free";
        }
        await group.save();
        await msg.save();
        
        for(let i=0;i<group.peoplesId.length;i++){
            const id=group.peoplesId[i].toString();
            const receiverSocketId=users[id];
            if(receiverSocketId){
                const liveKitData=await createLiveKitToken(id,data.groupId);
                io.to(receiverSocketId).emit("member_left_from_group_call",(
                    {groupId:data.groupId,userId:id,leftMemberId:data.senderId,liveKitData}
                ));
            }
        }
        for(let i=0;i<group.admin.length;i++){
            const id=group.admin[i].toString();
            const receiverSocketId=users[id];
            if(receiverSocketId){
                const liveKitData=await createLiveKitToken(id,data.groupId);
                io.to(receiverSocketId).emit("member_left_from_group_call",(
                   {groupId:data.groupId,userId:id,leftMemberId:data.senderId,liveKitData}
                ));
            }
        }
    }catch(err){
        throw err;
    }
}











//if no response for longer time remove


export const noResponseOfCall=async(data:
    {groupId:string,senderId:string,msgId:string},
    socket:Socket,io:Server,users:{[key:string]:string}
)=>{
    try{
        const [group,msg]=await Promise.all([
            groupChatModel.findById(data.groupId),
            groupMessage.findById(data.msgId)
        ]);
        if(!group){
            throw new Error("group not found");
        }
        if(!msg){
            throw new Error("msg not found");
        }
        msg.callStatus=msg.callStatus.filter(
            (id)=>id.userId.toString()!==data.senderId.toString()
        );
        if(msg.callStatus.length===0){
            group.callStatus="free";
        }
        await msg.save();
        await group.save();

        //jisna call kara group ka liya usko emit ab ki ya join nahi ho raha ha

        const receiverSocketId=users[msg.senderId];
        if(receiverSocketId){
            io.to(receiverSocketId).emit("no_response_of_call",(
                {groupId:data.groupId,senderId:data.senderId,callSendId:msg.senderId}
            ));
        }
    }catch(err){
        throw err;
    }
}