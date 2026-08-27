import {Request,Response,NextFunction} from 'express';
import { lastMessage } from '../models/conversion.model';
import { personalChat } from '../models/chat.model';


const getDisplayText = (msg: any) => {
    if (!msg) return "";
    if (msg.messageType === "text") {
        return msg.message || "";
    }
    // image, video, pdf, audio, file — in sab me caption text nahi hota
    return msg.orignalname || msg.message || "";
};

export const store_last_message=async(data:{senderId:string,receiverId:string,msg:string,messageType:string,originalname?:string})=>{
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
        let lastmessage="";
        if(data?.messageType && data.messageType!=="text"){
          lastmessage=data?.originalname || data.msg || "";
        }else{
          lastmessage=data.msg;
}
        if(findLastMessage){
            findLastMessage.lastmessage=lastmessage;
            findLastMessage.messageType=data.messageType;
            findLastMessage.clearBy=[],
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



//for update file ka ha ya many message come  ek ssaath

export const storeLastMessageForwardMessage=async(data:{senderId:string,receiverId:string})=>{
    try{
        const findLastMessage=await personalChat.findOne({
            $or:[
                {senderId:data.senderId,receiverId:data.receiverId},
                {senderId:data.receiverId,receiverId:data.senderId},
            ],
        }).sort({createdAt:-1});


        
        if(findLastMessage){
            const lastmsg = getDisplayText(findLastMessage);
            const lastMsg=await lastMessage.findOne({
                $or:[
                    {senderId:data.senderId,receiverId:data.receiverId},
                    {senderId:data.receiverId,receiverId:data.senderId},
                ],
            });
            if(lastMsg){
                lastMsg.lastmessage=lastmsg;
                lastMsg.messageType=findLastMessage.messageType;
                lastMsg.createdAt=findLastMessage.createdAt;
                lastMsg.updatedAt=findLastMessage.updatedAt;
                lastMsg.clearBy=[],
                await lastMsg.save();
                return lastMsg;
            }else{
                 const createLastMessage=await lastMessage.create({
                senderId:data.senderId,
                receiverId:data.receiverId,
                lastmessage:lastmsg,
                messageType:findLastMessage.messageType,
            });
            if(createLastMessage){
                return createLastMessage;
            }else{
                throw new Error("failed to create last message");
            }
            }
        }
    }catch(err){
        throw err;
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
            $or:[
                {senderId:senderId,receiverId:receiverId},
                {senderId:receiverId,receiverId:senderId},
            ],
            messageType:{$nin:["system"]},
        }).sort({createdAt:-1});

        if(!findLastChat){
            continue;
        }
        const isClearByThisUser=findLastMessage[i].clearBy?.includes(data.userId);
        const displayMsg = getDisplayText(findLastChat);
        response.push({
        senderId,
        receiverId,
        lastmessage: isClearByThisUser?"":displayMsg,
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
        },],
        messageType:{$nin:["system"]}
        }).sort({createdAt:-1});
        

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
            if(!findLastConversation){
                return null;
            }

        if (!findLastMessage) {
            const previousUpdatedAt=findLastConversation.updatedAt;
            findLastConversation.lastmessage = "";
            findLastConversation.messageType = "text";
            await findLastConversation.save();
            return {
                senderId: findLastConversation.senderId,
                receiverId: findLastConversation.receiverId,
                lastmessage: "",
                messageType: findLastConversation.messageType,
                createdAt:findLastConversation.createdAt,
                updatedAt: previousUpdatedAt,
            };
        }

                findLastConversation.lastmessage=findLastMessage.message;
                findLastConversation.messageType=findLastMessage?.messageType;
                await findLastConversation.save();
                return{
                    senderId: findLastConversation.senderId,
                    receiverId: findLastConversation.receiverId,
                    lastmessage: findLastConversation.lastmessage,
                    messageType: findLastConversation.messageType,
                    createdAt:findLastMessage.createdAt,
                    updatedAt: findLastMessage.updatedAt,
                }
    }catch(err){
        console.log(err);
        throw new Error("failed to delete and update last message");
    }
}






//for edit user edit it
export const update_chat_list_edit=async(data:{_id:string,senderId:string,receiverId:string,msg:string})=>{
try{
    console.log(data);
    const findLastMessage=await personalChat.findOne({
        $or:[{
            senderId:data.senderId,
            receiverId:data.receiverId,
        },
        {
            senderId:data.receiverId,
            receiverId:data.senderId,
        },
    ]
}).sort({createdAt:-1});
console.log(findLastMessage);
    const messageId=findLastMessage?._id.toString();
    if(messageId===data._id.toString()){
        //latest message only it is we need to update chat list now
        const findLastConversation=await lastMessage.findOne({
            $or:[{
                senderId:data.senderId,
                receiverId:data.receiverId,
            },
            {
                senderId:data.receiverId,
                receiverId:data.senderId,
            },
        ]});
        if(!findLastConversation){
            return null;
        }
        if (!findLastMessage) {
            const previousUpdatedAt=findLastConversation.updatedAt;
            findLastConversation.lastmessage = "";
            findLastConversation.messageType = "text";
            await findLastConversation.save();
            return {
                senderId: findLastConversation.senderId,
                receiverId: findLastConversation.receiverId,
                lastmessage: "",
                messageType: findLastConversation.messageType,
                createdAt:findLastConversation.createdAt,
                updatedAt: previousUpdatedAt,
            };
        }
        if(findLastConversation){
            console.log("finded conversation");
            findLastConversation.lastmessage=data.msg;
            await findLastConversation.save();
            return{
                senderId:findLastConversation.senderId,
                receiverId:findLastConversation.receiverId,
                lastmessage:findLastConversation.lastmessage,
                messageType:findLastConversation.messageType,
                createdAt:findLastConversation.createdAt,
                updatedAt:findLastConversation.updatedAt,
        }
   }else{
    return null;
   }
}
}catch(err){
    throw new Error("error occured in saving");
}
}












//this one is for after chat cleared after this is
export const updateLastMessage=async(data:{senderId:string,receiverId:string})=>{
    try{
        const lastmsg=await lastMessage.findOne({
            $or:[
                {senderId:data.senderId,receiverId:data.receiverId},
                {senderId:data.receiverId,receiverId:data.senderId},
            ]
        });
        if(!lastmsg){
            return;
        }
        lastmsg.clearBy.push(data.senderId);
        await lastmsg.save();
    }catch(err){
        throw new Error("something went wrong");
    }
}