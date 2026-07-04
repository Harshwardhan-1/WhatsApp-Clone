import {Request,Response,NextFunction} from 'express';
import { lastMessage } from '../models/conversion.model';
import { personalChat } from '../models/chat.model';

export const store_last_message=async(data:{senderId:string,receiverId:string,msg:string,messageType:string})=>{
    try{
        const findLastMessage=await lastMessage.findOne({
            $or:[
                {
                    senderId:data.senderId,
                    receiverId:data.receiverId,
                },
                {
                    senderId:data.receiverId,
                    receiverId:data.senderId,
                },
            ],
        });
        if(findLastMessage){
            findLastMessage.lastmessage=data.msg;
            findLastMessage.messageType=data.messageType;
            await findLastMessage.save();
            return findLastMessage;
        }else{   
            const createLastMessage=await lastMessage.create({
                senderId:data.senderId,
                receiverId:data.receiverId,
                lastmessage:data.msg,
                messageType:data.messageType,
            });
            if(createLastMessage){
                return createLastMessage;
            }else{
                throw new Error("failed to create last message");
            }
        }
    }catch(err){
        console.log(err);
        throw new Error("failed to store last message");
    }
}







//have to optimze  this query because it takes a long time if there are more users on chat list of user
export const get_last_message=async(data:{userId:string})=>{
try{
    const findLastMessage=await lastMessage.find({
        $or:[
        {
            senderId:data.userId,
        },
        {
            receiverId:data.userId,
        },
  ],
    });
    let response=[];
    for(let i=0;i<findLastMessage.length;i++){
        let senderId=findLastMessage[i].senderId;
        let receiverId=findLastMessage[i].receiverId;
        const findLastChat=await personalChat.findOne({
            $or:[{senderId:senderId,receiverId:receiverId},{senderId:receiverId,receiverId:senderId},]
        }).sort({createdAt:-1});
        response.push({
        senderId,
        receiverId,
        lastmessage: findLastMessage[i].lastmessage,
        messageType:findLastMessage[i].messageType,
        IsSend: findLastChat?.IsSend,
        isDelivered: findLastChat?.isDelivered,
        isSeen: findLastChat?.isSeen,
        createdAt: findLastChat?.createdAt,
        updatedAt:findLastChat?.updatedAt,
        });
    }
    return response;
}catch(err){
    throw new Error("something went wrong");
}
}







//operations delete for me,delete for everyone,edit update last message and chatlist



//delete for everyone  
//1 first find last message of both the user
//2 from conversational model update the last message and send to frontend/client
export const  update_chat_list=async(data:{senderId:string,receiverId:string})=>{
    try{
        const findLastMessage=await personalChat.findOne({
            $or:[{
                senderId:data.senderId,
                receiverId:data.receiverId
            },
        {
            senderId:data.receiverId,
            receiverId:data.senderId,
        },]
        }).sort({createdAt:-1});

        if(findLastMessage){
            const findLastConversation=await lastMessage.findOne({
                $or:[{
                    senderId:data.senderId,
                    receiverId:data.receiverId,
                },
                {
                    senderId:data.receiverId,
                    receiverId:data.senderId,
                },
            ]
            });
            if(findLastConversation){
                findLastConversation.lastmessage=findLastMessage.message;
                await findLastConversation.save();
                return{
                    senderId: findLastConversation.senderId,
                    receiverId: findLastConversation.receiverId,
                    lastmessage: findLastConversation.lastmessage,
                    messageType: findLastConversation.messageType,
                    createdAt:findLastMessage.createdAt,
                    updatedAt: findLastMessage.updatedAt,
                }
            }
    }
    }catch(err){
        throw new Error("failed to delete and update last message");
    }
}