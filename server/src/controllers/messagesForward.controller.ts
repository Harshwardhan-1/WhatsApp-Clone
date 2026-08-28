import { groupChatModel } from "../models/group.create.model";
import { groupMessage } from "../models/group.message.model";
import { personalChat } from "../models/chat.model";
import {Socket,Server} from 'socket.io';
import { store_last_message, storeLastMessageForwardMessage } from "./last.message.controller";
import { emitMessageInGroup } from "./group.message.controller";
import { disappearingModel } from "../models/disappearing.message.model";
import { notification } from "../models/mute.notification.model";
import { durationtoMs } from "../helper/durationtoMs";
import { createMessage } from "./group.message.controller";
import { storeGroupLastMessage } from "./group.lastMessage.controller";


interface targetType{
    type:string,
    id:string,
}

const disappearingMessageDuration=async(senderId:string,receiverId:string)=>{
    const disappearDuration=await disappearingModel.findOne({
        $or:[
            {senderId:senderId,receiverId:receiverId},
            {senderId:receiverId,receiverId:senderId},
        ]
    });
    if(disappearDuration){
      const duration=durationtoMs(disappearDuration?.duration);
        return duration;
    }
}

const notificationSound=async(senderId:string,receiverId:string):Promise<string>=>{
    const sound=await notification.findOne({
        senderId:receiverId,
        receiverId:senderId, 
    });
    if(sound){
        return sound.duration;
    }else{
        return "off";
    }
}

export const forward_messages=async(data:
    {messageIds:string[],senderId:string,targets: targetType[],sourceType?:"group"|"personal"},
    socket:Socket,io:Server,users:{[key:string]:string},
    activeChats:Record<string,string>,
    activeGroupChats:Record<string,string>
)=>{
    try{
        const sourceType = data.sourceType==="personal"?"personal":"group";

        const originalMessages = sourceType==="personal"
            ? await personalChat.find({_id:{ $in: data.messageIds}})
            : await groupMessage.find({_id:{ $in: data.messageIds}});

        if(originalMessages.length === 0) return;
        for(let i=0;i<data.targets.length;i++){
            const type=data.targets[i].type;
            const id=data.targets[i].id;

            if(type === 'user'){
                for(let j=0;j<originalMessages.length;j++){
                    const orignalMsg = originalMessages[j];   
                    const duration=await disappearingMessageDuration(data.senderId,id);
                    const sound=await notificationSound(data.senderId,id);

                    const create=new personalChat({
                        senderId:data.senderId,
                        receiverId:id,
                        message:orignalMsg.message,
                        messageType:orignalMsg.messageType,
                        fileUrl:orignalMsg?.fileUrl,
                        mimetype:orignalMsg?.mimetype,
                        filename:orignalMsg?.filename,
                        sizeInKb:orignalMsg?.sizeInKb,
                        sizeInMb:orignalMsg?.sizeInMb,
                        expiresAt:duration?new Date(Date.now()+duration):null,
                        notificationSound:sound,
                        isPinned:false,
                    });

                    const active=activeChats[id]===data.senderId;
                    const receiverSocketId=users[id];
                    if(active && receiverSocketId){
                        create.IsSend=true;
                        create.isDelivered=true;
                        create.isSeen=true;
                    }else if(receiverSocketId){
                        create.IsSend=true;
                        create.isDelivered=true;
                    }else{
                        create.IsSend=true;
                    }
                    await create.save();

                    const chatListUpdate=await storeLastMessageForwardMessage({senderId:data.senderId,receiverId:id});
                    if(receiverSocketId){
                        io.to(receiverSocketId).emit("receive_message",(create));
                        io.to(receiverSocketId).emit("chat_list_update",(chatListUpdate));
                    }
                    socket.emit("receive_message",(create));
                    socket.emit("chat_list_update",(chatListUpdate));
                }
            }

            else{
                for(let j=0;j<originalMessages.length;j++){
                    const msg = originalMessages[j];

                    const msgData = await createMessage({
                        _id: id.toString(),
                        senderId:data.senderId,
                        message:msg.message,
                        messageType:msg.messageType,
                        fileUrl:msg?.fileUrl,
                        mimetype:msg?.mimetype,
                        filename:msg?.filename,
                        sizeInKb:msg?.sizeInKb,
                        sizeInMb:msg?.sizeInMb,
                    });

                    //here we find group
                    const group=await groupChatModel.findById(id);
                    if(!group)continue;

                    await storeGroupLastMessage({
                        groupId:id.toString(),
                        senderId:data.senderId,
                        msgId:msgData._id.toString(),
                        message:msgData.message,
                        messageType:msgData.messageType,
                        orignalname:msgData.orignalname,
                        filename:msgData.filename,
                        mimetype:msgData.mimetype,
                    },group)

                    await emitMessageInGroup({_id:id,senderId:data.senderId},msgData,users,activeGroupChats,socket,io);
                }
            }
        }
    }catch(err){
        throw err;
    }
}