import { 
    clearChatConfig,
createGroupMessageConfig,
messageAction,
messageInfoConfig,
seenByConfig,
deleiveredToConfig,
groupLastMessageConfig,
} from "../configs/group.message.config";
import { groupMessage } from "../models/group.message.model";
import { groupDisappearingMessageModel } from "../models/disappearing.message.model";
import { durationtoMs } from "../helper/durationtoMs";
import { muteGroupNotificationModel } from "../models/mute.notification.model";
import { groupChatModel } from "../models/group.create.model";
import { groupFavourites } from "../models/favourites.model";
import { fail } from "../helper/AppError";
import { Socket,Server } from "socket.io";
import mongoose from 'mongoose';
import { groupLastMessage } from "../models/group.conversion.model";



//group message is which we send message to person ok
//here _id is the group id 
export const createMessage=async(data:createGroupMessageConfig)=>{
    try{
        const [group,checkDuration,muteGroupNotification]=await Promise.all([
            groupChatModel.findById(data._id),
            groupDisappearingMessageModel.findById(data._id),
            muteGroupNotificationModel.findOne({groupId:data._id,senderId:data.senderId})
        ]); 
        if(!group){
            throw new Error("group not find");
        }
        if(group.onlyAdminSendMessage){
        //here check if it is admin or not
        //because if admin turn on only admin can send message option we have to decline this
        const isAdmin=group.admin.some(
            (id)=>id.toString()===data.senderId.toString()
        );
        if(!isAdmin){
            fail("only admin can send message");
        }
        }

        let duration=null;
        if(checkDuration){
           duration=durationtoMs(checkDuration.duration);
        }

        let notification="off";
        if(muteGroupNotification){
           notification=muteGroupNotification.duration;
        }


        const createGroupMessage=await groupMessage.create({
            groupId:group._id,
            senderId:data.senderId,
            message:data.message,
            messageType:data.messageType,
            fileUrl:data?.fileUrl,
            mimetype:data?.mimetype,
            filename:data?.filename,
            orignalname:data?.originalname,
            sizeInKb:Number(data?.sizeInKb ?? 0),
            sizeInMb:Number(data?.sizeInMb ?? 0),
            expiresAt:duration?new Date(Date.now()+duration):null,
            notificationSound:notification,
        });
        if(!createGroupMessage){
            throw new Error("failed to create message");
        }
         createGroupMessage.isSend=true;
         const id=new mongoose.Types.ObjectId(data.senderId);
         createGroupMessage.seenBy.push(id);
         createGroupMessage.deliveredTo.push(id);
         await createGroupMessage.save();
        return createGroupMessage;
    }catch(err){
        console.log(err);
        throw err;
    }
}







// this is basically delete for everyone query
export const deleteMessageFromEveryone=async(data:
    {_id:string,msgId:string,senderId:string},
    socket:Socket,io:Server,users:{[key:string]:string},
    activeGroupChats:Record<string,string>
)=>{
    try{

        const [group,msg]=await Promise.all([
            groupChatModel.findById(data._id),
            groupMessage.findById(data.msgId),
        ]);
        if(!group){
            fail("group not found");
            return;
        }
        if(!msg){
            fail("message is already deleted or technical error at our end");
            return;
        }
        if(msg.senderId.toString()!==data.senderId.toString()){
            fail("don't have access to delete the message");
            return;
        }
        await msg.deleteOne();
        for(let i=0;i<group.peoplesId.length;i++){
            const id=group.peoplesId[i].toString();


            if(!activeGroupChats[id])continue;
            
            const isOnSameChat=activeGroupChats[id]===group._id.toString();
            const receiverSocketId=users[id];
            if(isOnSameChat && receiverSocketId){
            const allMsg=await groupMessage.find({groupId:data._id,hideIt:{$nin:[id]}});
                io.to(receiverSocketId).emit("delete_message_db",(allMsg));
            }
        }
        const allMsg=await groupMessage.find(
            {groupId:data._id,hideIt:{$nin:[data.senderId]}
            }).sort({createdAt:1});
        socket.emit("delete_message_db",(allMsg));
    }catch(err){
        console.log(err);
        throw err;
    }
}









//edit message
export const editGroupMessage=async(
    data:messageAction,socket:Socket,io:Server,
    users:{[key:string]:string},
    activeGroupChats:Record<string,string>
)=>{
    try{
        const [group,msg]=await Promise.all([
            groupChatModel.findById(data._id), 
            groupMessage.findById(data.msgId),
        ]);
        if(!group){
            throw new Error("group not found");
        }
        if(!msg){
            throw new Error("msg not found");
        }
        if(msg.messageType!=="text"){
            throw new Error("only text message can be edited");
        }
        if(msg.senderId.toString()!==data.senderId.toString()){
            throw new Error("don't have access to edit this");
        }
         msg.message=data.message;
         msg.isEdited=true;
         await msg.save();
         await msg.populate("senderId","name avatar");
         for(let i=0;i<group.peoplesId.length;i++){
            const id=group.peoplesId[i].toString();
            if(!activeGroupChats[id])continue;
            const activeChats=activeGroupChats[id]===msg.groupId.toString();
            const receiverId=users[id];
            if(activeChats && receiverId){
                io.to(receiverId).emit("group_message_edited",(msg));
            }
         }
         socket.emit("group_message_edited",(msg));
    }catch(err){
        console.log(err);
        throw err;
    }
}





//this is basically hide from senderId side 
export const deleteFromMe=async(data:messageAction)=>{
    try{
        const [group,msg]=await Promise.all([
            groupChatModel.findById(data._id),
            groupMessage.findById(data.msgId),
        ]);
        if(!group){
            fail("group not found");
            return;
        }
        if(!msg){
            fail("message not found");
            return;
        }
        msg.hideIt.push(data.senderId);
        await msg.save();
    }catch(err){
        console.log(err);
        throw err;
    }
}






//clear chat
export const clearChat=async(data:clearChatConfig)=>{
    try{
        const group=await groupChatModel.findById(data._id);
        if(!group){
            fail("group not found");
        }
        //taking a little bit longer time
        // const findByGroupId=await groupMessage.find({groupId:data._id});
        // for(let i=0;i<findByGroupId.length;i++){
        //     findByGroupId[i].hideIt.push(data.senderId);
        //     await findByGroupId[i].save();
        // }
    



        //after this we have to emit again from frontend chat clear message
        await groupMessage.updateMany(
            {groupId:data._id},
            {$addToSet:{hideIt:data.senderId}},
        );
    }catch(err){
        throw err;
    }
}










//here we will write about basic info about message seen deleiveredTo

export const messageInfo=async(data:messageInfoConfig)=>{
    try{
        console.log(data);
        const [group,msg]=await Promise.all([
            groupChatModel.findById(data._id),
            groupMessage.findById(data.msgId),
        ]);        
        if(!group){
            fail("group not found");
            return;
        }
        if(!msg){
            fail("msg info not found");   
            return;
        }
        await msg.populate("deliveredTo","name avatar");
        await msg.populate("seenBy","name avatar");
        //
        //here we will check like how many are remaing in delivered and seen by
            let seenBy=0,delivered=0;
            for(let i=0;i<group.peoplesId.length;i++){
                const peoplesId=group.peoplesId[i].toString();
                const deliveredCheck=msg.deliveredTo.some(
                    (user:any)=>user._id.toString()===peoplesId.toString()
                );
                if(deliveredCheck){
                    delivered++;
                }
                const seenByCheck=msg.seenBy.some(
                    (user)=>user._id.toString()===peoplesId.toString()
                );
                if(seenByCheck){
                   seenBy++; 
                }
            }
         return {
            _id: msg._id,
            message: msg.message,
            messageType: msg.messageType,
            deliveredTo: msg.deliveredTo,
            seenBy: msg.seenBy,
            deliveredRemaining: group.peoplesId.length - delivered,
            seenRemaining: group.peoplesId.length - seenBy,
        };
    }catch(err){
        throw err;
    }
}




//in this we emit a particular group all message to the frontend
export const seenByy=async(data:{_id:string,senderId:string},socket:Socket,io:Server,users:{[key:string]:string})=>{
    try{
        const [group,msg]=await Promise.all([
             groupChatModel.findById(data._id),
             groupMessage.find({groupId:data._id}),
        ]);
        if(!group){
            throw new Error("group not found");
        }
        for(let i=0;i<msg.length;i++){
            const check=msg[i].seenBy.some(
                (id)=>id.toString()===data.senderId.toString()
            );
            if(!check){
                msg[i].seenBy.push(new mongoose.Types.ObjectId(data.senderId));
            }
            await msg[i].save();
        }
        const groupPersonsLength=group.peoplesId.length;
        for(let i=0;i<msg.length;i++){
            if(msg[i].seenBy.length===groupPersonsLength){
                msg[i].isSeen=true;
            }
             await msg[i].save();
        }
        for(let i=0;i<group.peoplesId.length;i++){
            const id=group.peoplesId[i].toString();
            const receiverSocketId=users[id];
            if(receiverSocketId){
                io.to(receiverSocketId).emit("group_message_seen",(msg));
            }
        }
        socket.emit("group_message_seen",(msg))
    }catch(err){
        throw err;
    }
}






//when user comes online
export const delieveredTo=async(
    data:{senderId:string},
    users:{[key:string]:string},
    socket:Socket,io:Server,
    activeGroupChats:Record<string,string>
)=>{
    try{
        const findAllGroups=await groupChatModel.find({peoplesId:data.senderId});
        for(let i=0;i<findAllGroups.length;i++){
            const groupId=findAllGroups[i]._id;
            const allMessages=await groupMessage.find({groupId:groupId});   

            for(let j=0;j<allMessages.length;j++){
                const checkToPush=allMessages[j].deliveredTo.some(
                    (id)=>id.toString()===data.senderId.toString()
                );
                if(!checkToPush){
                    const id=new mongoose.Types.ObjectId(data.senderId);
                    allMessages[j].deliveredTo.push(id);
                }
                const totalMembersInGroup=findAllGroups[i].peoplesId.length;
                if(allMessages[j].deliveredTo.length===totalMembersInGroup){
                    allMessages[j].isDelivered=true;
                }
                await allMessages[j].save();
            }        
            for(let k=0;k<findAllGroups[i].peoplesId.length;k++){
                const id=findAllGroups[i].peoplesId[k].toString();
                    const receiverId=users[id];
                    if(receiverId){
                    io.to(receiverId).emit("group_message_delivered",(allMessages));    
                    }
                }
        }
    }catch(err){
        throw err;
    }
}







//total pending message of all group in which user has joined which we have to show on chatlist


export const allNotSeenMessage=async(data:{senderId:string})=>{
    try{
        const group=await groupChatModel.find({peoplesId:data.senderId});
        const record:Record<string,number>={};
        for(let i=0;i<group.length;i++){
            const allMessages=await groupMessage.find({groupId:group[i]._id});
            let count=0;
            for(let i=0;i<allMessages.length;i++){
                const findUserId=allMessages[i].seenBy.some(
                    (id)=>id.toString()===data.senderId.toString()
                );
                if(!findUserId){
                    count++;
                }
            }
            //now here push some how logic groupId and count
            const groupId=group[i]._id.toString();
            record[groupId]=count;
        }
        return record;
    }catch(err){
        throw err;
    }
}






//add group to favourites

export const addToFavourites=async(data:{_id:string,senderId:string})=>{
    try{
        const group=await groupChatModel.findById(data._id);
        if(!group){
            fail("group not found");
        }
        const checkFav=await groupFavourites.findOne({groupId:data._id,senderId:data.senderId});
        if(!checkFav){
            const groupId=new mongoose.Types.ObjectId(data._id);
            const id=new mongoose.Types.ObjectId(data.senderId);


            const create=await groupFavourites.create({
                groupId,
                senderId:id,
                isMarkedAsFavourites:true,
            });
            if(!create){
                fail("fail to add into favourites"); 
            }
            return create;
        }else{
            const favourites=await groupFavourites.findOne({groupId:data._id,senderId:data.senderId});
            if(favourites){
                if(favourites.isMarkedAsFavourites){
                  favourites.isMarkedAsFavourites=!favourites.isMarkedAsFavourites;
                  await favourites.save();
                  return "Remove from favourites";
                }else{
                    favourites.isMarkedAsFavourites=!favourites.isMarkedAsFavourites;
                    await favourites.save();
                    return "Add to favourites";
                }
            }
        }
    }catch(err){
        throw err;
    }
}






//only person who create group can see favourites

export const showFavourites=async(data:{_id:string,senderId:string})=>{
    try{
        const group=await groupChatModel.findById(data._id);
        if(!group){
            fail("group not found");
        }
        if(group?.groupCreatorId.toString()!==data.senderId){
            fail("you don't have access to view the favourites in the group");
        }
        const findFavourites=await groupFavourites.find({groupId:data._id}).populate("senderId","name avatar");
        if(findFavourites.length==0){
            return;
        }else{
            return findFavourites;
        }
    }catch(err){
        throw err;
    }
}








//mute notification
//groupId and senderId
//whenever user click on mute notification we fetch latest mute notification
//that is set by user
export const muteNotificattion=async(data:{_id:string,senderId:string})=>{
    try{
        const group=await groupChatModel.findById(data._id);
        if(!group){
            fail("group not found");
        }
        const findMuteNotification=await muteGroupNotificationModel.
        findOne({groupId:data._id,senderId:data.senderId});

        if(findMuteNotification){
           return findMuteNotification.duration; 
        }
    }catch(err){
        throw err;
    }
}




export const changedMuteNotificationSetting=async(data:{_id:string,senderId:string,duration:string})=>{
    try{
        const group=await groupChatModel.findById(data._id);
        if(!group){
            fail("group not found");
        }
        const changeSetting=await muteGroupNotificationModel.findOne({groupId:data._id,senderId:data.senderId});
        if(!changeSetting){
            const create=await muteGroupNotificationModel.create({
                groupId:data._id,
                senderId:data.senderId,
                duration:data.duration,
            });
            if(!create){
                fail("fail to create mute notification model");
            }
            return create;
        }else{
            changeSetting.duration=data.duration;
            await changeSetting.save();
            return changeSetting;
        }
    }catch(err){
        throw err;
    }
}






//disappearing message
//if admin has mark it false then on client side w have ti show disable option

export const changeGroupDisappearingMessageSetting=async(data:{_id:string,senderId:string,duration:string})=>{
    try{
        const group=await groupChatModel.findById(data._id);
        if(!group){
            fail("group not found");
            return;
        }
        if(group.changeDisappearingMessageSetting){
            const checkDurationExist=await groupDisappearingMessageModel.findOne({groupId:data._id});
            if(!checkDurationExist){
                const create=await groupDisappearingMessageModel.create({
                    groupId:data._id,
                    senderId:data.senderId,
                    duration:data.duration,
                });
                return create;
            }else{
                checkDurationExist.duration=data.duration;
                await checkDurationExist.save();
                return checkDurationExist;
            }
        }else{
            if(group.groupCreatorId.toString()!==data.senderId){
                fail("only admin can change group disappearing message setting");
            }else{
         const checkDurationExist=await groupDisappearingMessageModel.findOne({groupId:data._id});
         if(!checkDurationExist){
                const create=await groupDisappearingMessageModel.create({
                    groupId:data._id,
                    senderId:data.senderId,
                    duration:data.duration,
                });
                if(!create){
                    fail("something went wrong");
                }
               }else{
                checkDurationExist.duration=data.duration;
                await checkDurationExist.save();
                return checkDurationExist;
               }
            }
        }
    }catch(err){
        throw err;
    }
}








export const getDuationgMessage=async(data:{_id:string,senderId:string})=>{
    try{
        const group=await groupChatModel.findById(data._id);
        if(!group){
            fail("group not found");
            return;
        }
        const duration=await groupDisappearingMessageModel.findOne({groupId:data._id});
        if(duration){
            return duration.duration;
        }
    }catch(err){
        throw err;
    }
}








//now here we will show all media files links
export const allMedia=async(_id:string)=>{
    try{
    const media = await groupMessage.find({groupId: _id,mimetype:{$regex:"^(image|video)",$options: "i"}});
    return media; 
   }catch(err){
        throw err;
    }
}


export const allDocs=async(_id:string)=>{
    try{
        const docs=await groupMessage.find({groupId:_id,mimetype:{$regex:"^(application)",$options:"i"}});
        return docs;
    }catch(err){
        throw err;
    }
}



export const allLinks=async(_id:string)=>{
    try{
        const links=await groupMessage.find({groupId:_id,
        message:{ $regex: "((https?:\\/\\/)?(www\\.)?[a-zA-Z0-9-]+\\.[a-zA-Z]{2,}(\\/[^\\s]*)?)", $options: "i"},
        messageType:"text",    
        });
        return links;
    }catch(err){
        throw err;
    }
}








//here the logic is basically we will emit message according to 
//here we basically deieiver message


//_id is groupId basically
export const emitMessageInGroup=async(
    data:{_id:string,senderId:string},
    msgData:any,
    users:{[key:string]:string},
    activeGroupChats:Record<string,string>,socket:Socket,io:Server)=>{
    try{
        const group=await groupChatModel.findById(data._id);
        if(!group){
            fail("group not found");
            return;
        }
        //data._id is wo message jo emit karna ha apana ko
        const msg=await groupMessage.findById(msgData._id);
        if(!msg){
            fail("msg not found ot something went wrong");
            return;
        }

            await msg.populate("senderId","name avatar");

        for(let i=0;i<group.peoplesId.length;i++){
            //here we are checking that in peoplesId it is basically sender and 
            //receiverId only 
            const receiverId=group.peoplesId[i].toString();
            if (receiverId===data.senderId.toString()){
                continue;
            }
            if(activeGroupChats[receiverId]===data._id){
                const id=new mongoose.Types.ObjectId(receiverId);
                msg.deliveredTo.push(id); 
                msg.seenBy.push(id);
                const receiverSocketId=users[receiverId];
                   console.log("emitting to:", receiverId, receiverSocketId);
                if(receiverSocketId){
                io.to(receiverSocketId).emit("receive_group_message",(msg));
                }
            }else if(activeGroupChats[receiverId]!==data._id && users[receiverId]){
                const id=new mongoose.Types.ObjectId(receiverId);
                msg.deliveredTo.push(id);
                 const receiverSocketId=users[receiverId];
                if(receiverSocketId){
                io.to(receiverSocketId).emit("receive_group_message",(msg));
                }
            }
        }
           //send to sender also
            socket.emit("receive_group_message",(msg));
        await msg.save();
         if(group.peoplesId.length===msg.deliveredTo.length){
            msg.isDelivered=true;
            await msg.save();
                socket.emit("update_deliveredTo",(msg));
            }
         if(group.peoplesId.length===msg.seenBy.length){
            msg.isSeen=true;
            await msg.save();
                socket.emit("update_seenBy",(msg));
         }
    }catch(err){
        console.log(err);
        throw err;
    }
}













//parent reply reply on reply
export const replyToParent=async(
    data:
    {_id:string,msgId:string,message:string,messageType:string,senderId:string,parentReply:string
    },socket:Socket,io:Server,users:{[key:string]:string},activeGroupChats:Record<string,string>)=>{
    try{
        const [group,msg,checkDuration,muteGroupNotification]=await Promise.all([
            groupChatModel.findById(data._id),
            groupMessage.findById(data.msgId),
            groupDisappearingMessageModel.findById(data._id),
            muteGroupNotificationModel.findOne({groupId:data._id,senderId:data.senderId})
        ]); 
         if(!group){
            fail("group not found");
            return;
        }
        if(!msg){
            fail("message not found");
            return;
        }
        if(group.onlyAdminSendMessage){
        const isAdmin=group.admin.some(
            (id)=>id.toString()===data.senderId.toString()
        );
        if(!isAdmin){
            fail("only admin can send message");
            return;
        }
        }

        let duration=null;
        if(checkDuration){
           duration=durationtoMs(checkDuration.duration);
        }

        let notification="off";
        if(muteGroupNotification){
           notification=muteGroupNotification.duration;
        }
       

        const createGroupMessage=await groupMessage.create({
            groupId:group._id,
            senderId:data.senderId,
            message:data.message,
            messageType:data.messageType,
            expiresAt:duration?new Date(Date.now()+duration):null,
            notificationSound:notification,
        });
        if(!createGroupMessage){    
            throw new Error("failed to create message");
        }
        const msgId=new mongoose.Types.ObjectId(data.msgId);
        const userId=new mongoose.Types.ObjectId(data.senderId);
        createGroupMessage.parentReply.push({messageId:msgId,userId:userId,message:msg.message,messageType:msg.messageType});
        await createGroupMessage.populate("parentReply.userId","name avatar");
        await createGroupMessage.save();
        

        for(let i=0;i<group.peoplesId.length;i++){
            const id=group.peoplesId[i].toString();
            const activeChats=activeGroupChats[id];
            if(!activeChats || activeChats!==msg.groupId.toString())return;

            const receiverSocketId=users[id];
            if(activeChats && receiverSocketId){
                io.to(receiverSocketId).emit("reply_on_parent_message",(createGroupMessage));
            }
        }
        socket.emit("reply_on_parent_reply",(createGroupMessage));
    }catch(err){
        throw err;
    }
}













//groupId _id msgId messageId
export const emoji=async(data:
    {_id:string,msgId:string,senderId:string,emoji:string},
    socket:Socket,io:Server,users:{[key:string]:string},
    activeGroupChats:Record<string,string>
)=>{
    try{
        const group=await groupChatModel.findById(data._id);
        if(!group){
            fail("group not found");
            return;
        }
        const msg=await groupMessage.findById(data.msgId);
        if(!msg){
            throw new Error("message not found");
        }
         const exist=msg.reaction.find(
            (id)=>id.userId.toString()===data.senderId.toString()
         );
         if(exist){
            if(exist.emoji===data.emoji){
                msg.reaction=msg.reaction.filter(
                (id)=>id.userId.toString()!==data.senderId.toString()
                );
            }else{
                exist.emoji=data.emoji;
            }
         }else{
            const id=new mongoose.Types.ObjectId(data.senderId);
            msg.reaction.push({userId:id,emoji:data.emoji});
         }
         await msg.save();
         for(let i=0;i<group.peoplesId.length;i++){
            const id=group.peoplesId[i].toString();
            const activeChats=activeGroupChats[id];
            if(!activeChats)continue;
            const receiverSocketId=users[id];
            if(activeChats===msg.groupId.toString() && receiverSocketId){
                io.to(receiverSocketId).emit("emoji_operation",(msg));
            }
         }
         socket.emit("emoji_operation",(msg));
    }catch(err){
        throw err;
    }
}







//show all message to user

export const showAllMessage=async(data:{_id:string,senderId:string})=>{
    try{
         const message=await groupMessage.find(
        {groupId:data._id,
        hideIt:{$nin:[data.senderId]}
},
    ).sort({createdAt:1});

    for(let i=0;i<message.length;i++){
        await message[i].populate("senderId","name avatar");
    }
    return message;
    }catch(err){
        throw err;
    }
}










export const store_group_last_message=async(data:groupLastMessageConfig)=>{
    try{
        const id=new mongoose.Types.ObjectId(data.groupId);//data._id is groupId
        const sID=new mongoose.Types.ObjectId(data.senderId);
        const msg=await groupLastMessage.create({
            groupId:id,
            senderId:sID,
            msgId:data.msgId,
            message:data.message,
            messageType:data.messageType,
            filename:data?.filename,
            orignalname:data?.orignalname,
            mimetype:data?.mimetype,
        });
        if(!msg){
            throw new Error("failed to store last message");
        }
        return msg;
    }catch(err){
        throw err;
    }
}









export const allGroupLastMessages=async(data:{senderId:string})=>{
    try{
        const allGroups=await groupChatModel.find({peoplesId:data.senderId});

        let response=[];
        for(let i=0;i<allGroups.length;i++){
            //all yaha sair id bhi aaengi sab group jo bana ha unki apana pass
            const lastMessage=await groupLastMessage.findOne(
                {groupId:allGroups[i]._id,messageType:{$ne:"system"}}).sort({createdAt:-1});
            if(!lastMessage){
                continue;
            }else{
                //here groupId is basically the data of last message
                await lastMessage.populate("senderId","name avatar");
                response.push(lastMessage);
            }
        }
        return response;
    }catch(err){
        throw err;
    }
}






//delete for everyont this is
//_id is groupId
export const update_chat_list_delete=async(data:{_id:string,msgId:string,senderId:string})=>{
    try{
        const [group,msg]=await Promise.all([
            groupChatModel.findById(data._id),
            groupLastMessage.findOne({groupId:data._id,msgId:data.msgId}),
        ]); 
         if(!group){
            throw new Error("group not found");
         }
         if(!msg){
            throw new Error("something went wrong");
         }
        await msg.deleteOne();
        //now again fetch last message of group and send to frontend so chatlist show correct data
        const lastMessage=await groupLastMessage.findOne(
            {groupId:data._id,
            messageType:{$ne:"system"}})
            .sort({updatedAt:-1});

            if(!lastMessage){
                return;
            }
            return lastMessage;
    }catch(err){
        throw err;
    }
}








//edit message 
//edit only if it is last message of group because on prev we don't update chatlist
export const editChatListMessage=async(data:
    {_id:string,msgId:string,senderId:string,message:string,messageType:string,
})=>{
    try{
        if(data.messageType!=="text"){
            throw new Error("not a valid message type to edit");
        }
        const msg=await groupLastMessage.findOne(
            {groupId:data._id,messageType:{$ne:"system"}}
        ).sort({createdAt:-1});
    
        if(!msg){
            return;
        }
        //if this is the case this is the last message of this group 
        //and we have to update chat list
        if(msg.msgId.toString()===data.msgId.toString()){
            msg.message=data.message;
            msg.messageType=data.messageType;
            await msg.save();
            
            return msg;
        }else{
            return null;
        }
    }catch(err){
        throw err;
    }
} 