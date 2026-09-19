import mongoose from 'mongoose';
import {Socket,Server} from 'socket.io';
import { storeGroupLastMessage } from './group.lastMessage.controller';
import { groupMessage } from '../models/group.message.model';
import { groupChatModel } from '../models/group.create.model';
import { groupCallCreatedType } from '../types/group.call.types';
import { emitMessageInGroup } from './group.message.controller';
import { createLiveKitToken } from '../utils/liveKitToken';
import { callChat } from '../models/InCallChat.model';




const isUserEngagedElsewhere = async (userId: string, excludeGroupId: string): Promise<boolean> => {
    const busyGroups = await groupChatModel.find({
        $or: [{ peoplesId: userId }, { admin: userId }],
        callStatus: "busy",
        _id: { $ne: excludeGroupId },
    });

    for (const grp of busyGroups) {
        const latestCallMsg = await groupMessage
            .findOne({ groupId: grp._id.toString(), messageType: "call" })
            .sort({ createdAt: -1 });

        if (!latestCallMsg) continue;

        const isOngoingHere = (latestCallMsg.callStatus ?? []).some(
            (entry) => entry.userId.toString() === userId.toString() && entry.status === "ongoing"
        );
        if (isOngoingHere) return true;
    }
    return false;
};


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
        const id=Math.floor(Math.random()*10).toString();
        const create=await groupMessage.create({
            groupId:data.groupId,
            callId:id,
            senderId:data.senderId,
            message:`${data.messageType}`,
            messageType:"call",
        });
        if(!create){
            throw new Error("failed to create Msg");
        }
        create.isSend = true;
        const senderObjId = new mongoose.Types.ObjectId(data.senderId);
        create.seenBy.push(senderObjId);
        create.deliveredTo.push(senderObjId);
        await create.save();

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


       
        for(let i=0;i<data.receiverId.length;i++){
            const id=data.receiverId[i].toString();
            if(id===data.senderId.toString())continue;
            const receiverSocketId=users[id];

            const isEngaged = await isUserEngagedElsewhere(id, data.groupId);

            if(receiverSocketId && !isEngaged){
                //from frontend we will call accepted for it and then join them at accepted function
                create.callStatus!.push({userId:new mongoose.Types.ObjectId(id),status:"ongoing"});
                io.to(receiverSocketId).emit("user_available_for_call",(
                    {
                        groupId:data.groupId,
                        senderId:data.senderId,
                        receiverId:id,
                        msgId:create._id.toString(),
                        messageType:data.messageType,
                    }
                ));
            }
        }
        await create.save();

        // caller ko khud ka LiveKit token bhejo aur call active kar do
        const LiveKitData=await createLiveKitToken(data.senderId,data.groupId);
        socket.emit("user_accepted_group_call",(
            {
                groupId:data.groupId,
                senderId:data.senderId,
                LiveKitData,
                msgId:create._id.toString(),
                messageType:data.messageType,
            }
        ));
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
export const callAccepted=async(data:{groupId:string,senderId:string,msgId:string,messageType:string},
    socket:Socket,io:Server,
    users:{[key:string]:string},
)=>{
    try{
        const group=await groupChatModel.findById(data.groupId);
        if(!group){
            throw new Error("group not found");
        }
        const memberIds = Array.from(new Set([
            ...group.peoplesId.map((p) => p.toString()),
            ...group.admin.map((a) => a.toString()),
        ]));
        const msg=await groupMessage.findById(data.msgId);

        if(!msg){
            throw new Error("call message not found");
        }
        const userId=data.senderId.toString();

        if(!msg.seenBy.some((id)=>id.toString()===userId)){
            msg.seenBy.push(new mongoose.Types.ObjectId(data.senderId));
        }

        if(!msg.deliveredTo.some((id)=>id.toString()===userId)){
            msg.deliveredTo.push(new mongoose.Types.ObjectId(data.senderId));
        }
        await msg.save();
        
        for(const id of memberIds){
            const receiverSocketId=users[id];
            if(receiverSocketId){
                const liveKitData=await createLiveKitToken(id,data.groupId);
                io.to(receiverSocketId).emit("new_member_added_in_groupCall",(
                    {
                        groupId:data.groupId,
                        userId:id,
                        newMemberId:data.senderId,
                        liveKitData,
                        msgId:data.msgId,
                        messageType:data.messageType,
                    }
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

        // ===== FIX: yahan bhi peoplesId + admin dedupe kar diya =====
        const memberIds = Array.from(new Set([
            ...group.peoplesId.map((p) => p.toString()),
            ...group.admin.map((a) => a.toString()),
        ]));

        for(const id of memberIds){
            const receiverSocketId=users[id];
            if(receiverSocketId){
                const liveKitData=await createLiveKitToken(id,data.groupId);
                io.to(receiverSocketId).emit("member_left_from_group_call",(
                    {
                        groupId:data.groupId,
                        userId:id,
                        leftMemberId:data.senderId,
                        liveKitData,
                        msgId:data.msgId,
                        messageType:msg.message,
                    }
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










export const cleanupUserFromCalls = async (
    userId: string,
    io: Server,
    users: { [key: string]: string }
) => {
    try{
        const stuckMsgs = await groupMessage.find({
            messageType: "call",
            callStatus: { $elemMatch: { userId: new mongoose.Types.ObjectId(userId), status: "ongoing" } },
        });

        for (const msg of stuckMsgs) {
            msg.callStatus = (msg.callStatus ?? []).filter(
                (entry) => entry.userId.toString() !== userId.toString()
            );

            const group = await groupChatModel.findById(msg.groupId);
            if (!group) {
                await msg.save();
                continue;
            }

            if (msg.callStatus.length === 0) {
                group.callStatus = "free";
            }
            await group.save();
            await msg.save();

            const notifyIds = Array.from(new Set([
                ...group.peoplesId.map((p) => p.toString()),
                ...group.admin.map((a) => a.toString()),
            ]));

            for (const id of notifyIds) {
                const receiverSocketId = users[id];
                if (receiverSocketId) {
                    const liveKitData = await createLiveKitToken(id, group._id.toString());
                    io.to(receiverSocketId).emit("member_left_from_group_call", {
                        groupId: group._id.toString(),
                        userId: id,
                        leftMemberId: userId,
                        liveKitData,
                        msgId: msg._id.toString(),
                        messageType: msg.message,
                    });
                }
            }
        }
    }catch(err){
        console.error("cleanupUserFromCalls failed:", err);
    }
};