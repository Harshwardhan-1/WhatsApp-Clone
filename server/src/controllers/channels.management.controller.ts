import { channels } from "../models/channels.model";
import type { createChannelConfig } from "../configs/channels.config";
import { createChannelValidate } from "../validators/channels.validator";
import {Socket,Server } from "socket.io";
import mongoose from 'mongoose';
import { store_last_message } from "./last.message.controller";
import { personalChat } from "../models/chat.model";



export const create_channel=async(data:createChannelConfig,
    socket:Socket,io:Server,
    users:{[key:string]:string}
)=>{
    try{
        const parsed=createChannelValidate.safeParse(data);
        if(!parsed.success){
            const errMsg=parsed.error.issues[0].message;
            throw new Error(errMsg);
        }
        const {name,description,profilePic,category}=parsed.data;
        const id=new mongoose.Types.ObjectId(data.senderId);
        const create=await channels.create({
           name:name,
           channelCreator:id,
           description:description,
           profilePic:profilePic,
           category:category, 
        });
        if(!create){
            throw new Error("failed to create channel");
        }
        create.admin.push(new mongoose.Types.ObjectId(id));
        await create.save();
        socket.emit("channel_created",(create));
        const allChannel=await allUserChannel({senderId:data.senderId},socket);
        socket.emit("all_user_channel",(allChannel));
    }catch(err){
        throw err; 
    }
}




export const allUserChannel=async(data:{senderId:string},socket:Socket)=>{
    try{
        const channel=await channels.find({
            $or:[
                {channelCreator:data.senderId},
                {followers:data.senderId},
            ]
    });
        socket.emit("all_user_channel",(channel));
        return channel;
    }catch(err){
        throw err;
    }
}







//
//1 toggle channel follow 
//2 update follow count



export const toggleFollow=async(data:{_id:string,senderId:string},
    socket:Socket,io:Server,users:{[key:string]:string},
)=>{
    try{
        const channel=await channels.findById(data._id);
        if(!channel){
            throw new Error("channel not found");
        }
        const checkAlreadyFollow=channel.followers.some(
            (id)=>id.toString()===data.senderId.toString()
        );
        if(checkAlreadyFollow){
            channel.followers=channel.followers.filter(
            (id)=>id.toString()!==data.senderId.toString()
            );   
        }else{
            channel.followers.push(new mongoose.Types.ObjectId(data.senderId));
        }
        await channel.save();
        const totalFollowersCount=channel.followers.length;
        const msg=checkAlreadyFollow?"Unfollow":"Follow";
        socket.emit("toggle_follow",({_id:channel._id.toString(),count:totalFollowersCount,message:msg}));


        //now we have to emit the follow count to all the users

        for(let i=0;i<channel.followers.length;i++){
            const id=channel.followers[i].toString();
            if(id===data.senderId.toString())continue;
            const receiverSocketId=users[id];
            if(receiverSocketId){
             io.to(receiverSocketId).emit("toggle_follow",{_id:channel._id.toString(),count:totalFollowersCount,message:msg});
            }
        }
    }catch(err){
        throw err;
    }
}









//send message to peoples who user send the request to accept the follow request


//_id is basically channel id,senderId, all the receiverId that we want to send the messages


//if admin accept we will hanel in toggle like
export const sendChannelAcceptRequest=async(data:
    {_id:string,senderId:string,peoplesId:string[]},
    socket:Socket,io:Server,
    users:{[key:string]:string},
    activeChats:Record<string,string>
)=>{
    try{
        const channel=await channels.findById(data._id);
        if(!channel){
            throw new Error("channel not found");
        }
        for(let i=0;i<data.peoplesId.length;i++){
            const receiverId=data.peoplesId[i].toString();
            const receiverSocketId=users[receiverId];
            const msg=await personalChat.create({
                senderId:data.senderId,
                receiverId:receiverId,
                message:`${channel.name} invite link `,
                messageType:"channelMsg",
                channelInvite:data._id.toString(),
            });
            if(!msg){
                throw new Error("something went wrong");
            }
            const update_last_message=await store_last_message({senderId:data.senderId,receiverId,msg:msg.message,messageType:"channelMsg"});
            if(receiverSocketId){
                msg.IsSend=true;
                msg.isDelivered=true;
                if(activeChats[receiverId]===data.senderId){
                    msg.isSeen=true;
                }
                await msg.save();
                io.to(receiverSocketId).emit("chat_list_update",update_last_message);
                io.to(receiverSocketId).emit("receive_message",(msg));
            }
            socket.emit("receive_message",(msg));
            socket.emit("chat_list_update",(update_last_message));
        }
    }catch(err){
        throw err;
    }
}















//add admin creator add admin


export const sendChannelAdminRequest=async(data:
    {_id:string,senderId:string,adminIds:string[]},
    socket:Socket,io:Server,users:{[key:string]:string},
    activeChats:Record<string,string>
)=>{
    try{
        const channel=await channels.findById(data._id);
        if(!channel){
            throw new Error("channel not found");
        }
        if(data.senderId.toString()!==channel.channelCreator.toString()){
            throw new Error("don't have access to send admin access request");
        }
        for(let i=0;i<data.adminIds.length;i++){
            const id=data.adminIds[i].toString();
            const msg=await personalChat.create({
                senderId:data.senderId,
                receiverId:id,
                message:`Accept this to be the admin of ${channel.name} channel`,
                messageType:"channelMsg",
                channelInvite:data._id.toString()
            });
            if(!msg){
                throw new Error("failed to send message");
            }
            const update_last_message=await store_last_message({senderId:data.senderId,receiverId:id,msg:msg.message,messageType:msg.messageType});
            const receiverSocketId=users[id];
            if(receiverSocketId){
                msg.IsSend=true;
                msg.isDelivered=true;
                if(activeChats[id]===data.senderId){
                    msg.isSeen=true;
                }
                await msg.save();
                io.to(receiverSocketId).emit("chat_list_update",(update_last_message));
                io.to(receiverSocketId).emit("receive_message",(msg));
            }
            socket.emit("receive_message",(msg));
            socket.emit("chat_list_update",(update_last_message));
        }
    }catch(err){
        throw err;
    }
}






//_id is channel id here sender is basically the person who accepted the invite 
export const invitationAcceptedAsAdmin=async(data:{_id:string,msgId:string,senderId:string,receiverId:string},
    socket:Socket,io:Server,
    users:{[key:string]:string},
)=>{
    try{
        const channel=await channels.findById(data._id);
        if(!channel){
            throw new Error("channel not found");
        }
        const alreadyAnAdmin=channel.admin.some(
            (id=>id.toString()===data.senderId.toString())
        );
        if(alreadyAnAdmin){
            return;
        }
        channel.admin.push(new mongoose.Types.ObjectId(data.senderId));

        const isInFollowers=channel.followers.some(
            (id)=>id.toString()===data.senderId.toString()
        );
        if(!isInFollowers){
            channel.followers.push(new mongoose.Types.ObjectId(data.senderId));
        }
        await channel.save();

        //now we change the message that we send join using it to to you are an admin now

        const msg=await personalChat.findById(data.msgId);
        if(!msg){
            throw new Error("message not found");
        }
        msg.message=`you are now admin of the channel ${channel.name}`;
        await msg.save();
        socket.emit("accepted_invitation_edited",({senderId:data.senderId,msgId:data.msgId}));
        const receiverSocketId=users[data.receiverId];
        if(receiverSocketId){
            io.to(receiverSocketId).emit("accepted_invitation_edited",({senderId:data.senderId,receiverId:data.receiverId,msgId:data.msgId}));
        }
    }catch(err){
        throw err;
    }
}













export const editChannelName=async(data:
    {_id:string,senderId:string,name:string},
    socket:Socket,io:Server,users:{[key:string]:string}
)=>{
    try{
        const channel=await channels.findById(data._id);
        if(!channel){
            throw new Error("channel not exist");
        }
        if(data.senderId.toString()!==channel.channelCreator.toString()){
            throw new Error("don't have access to change the channel name");
        }
        channel.name=data.name;
        await channel.save();
        for(let i=0;i<channel.followers.length;i++){
            const id=channel.followers[i].toString();
            const receiverSocketId=users[id];
            if(receiverSocketId){
                io.to(receiverSocketId).emit("channel_name_changed",({_id:data._id,name:channel.name}));
            }
        }
        socket.emit("channel_name_changed",({_id:data._id,name:channel.name}));
    }catch(err){
        throw err;
    }
}







export const channelDescription=async(data:
    {_id:string,senderId:string,description:string},
    socket:Socket,io:Server,
    users:{[key:string]:string},
)=>{
    try{
        const channel=await channels.findById(data._id);
        if(!channel){
            throw new Error("channel not found");
        }
        if(data.senderId.toString()!==channel.channelCreator.toString()){
            throw new Error("don't have access to edit description");
        }
        channel.description=data.description;
        await channel.save();
        for(let i=0;i<channel.followers.length;i++){
            const id=channel.followers[i].toString();
            const receiverSocketId=users[id];
            if(receiverSocketId){
                io.to(receiverSocketId).emit("channel_description_changed",({_id:data._id,description:data.description}));
            }
        }
        socket.emit("channel_description_changed",({_id:data._id,description:data.description}));
    }catch(err){
        throw err;
    }
}








export const updateChannelProfilePic=async(data:
    {_id:string,senderId:string,profilePic:string},
    socket:Socket,io:Server,
    users:{[key:string]:string},
)=>{
    try{
        const channel=await channels.findById(data._id);
        if(!channel){
            throw new Error("channel not found");
        }
        if(data.senderId.toString()!==channel.channelCreator.toString()){
            throw new Error("don't have access to update profile Pic");
        }
        channel.profilePic=data.profilePic;
        await channel.save();
        for(let i=0;i<channel.followers.length;i++){
            const id=channel.followers[i].toString();
            const receiverSocketId=users[id];
            if(receiverSocketId){
                io.to(receiverSocketId).emit("channel_pic_updated",({_id:data._id,message:data.profilePic}));
            }
        }
        socket.emit("channel_pic_updated",({_id:data._id,message:data.profilePic}));
    }catch(err){
        throw err;
    }
}






//delete channel
export const deleteChannel=async(data:
    {_id:string,senderId:string},
    socket:Socket,io:Server,
    users:{[key:string]:string},
)=>{
    try{
        const channel=await channels.findById(data._id);
        if(!channel){
            throw new Error("channel not found");
        }
        if(data.senderId.toString()!==channel.channelCreator.toString()){
            throw new Error("don't have access to delete this channel only owner can delete this channel");
        }
        for(let i=0;i<channel.followers.length;i++){
            const id=channel.followers[i].toString();
            const receiverSocketId=users[id];
            if(receiverSocketId){
                io.to(receiverSocketId).emit("channel_deleted",({_id:data._id,message:"channel_no_longer_exist"}));
            }
        }
        socket.emit("channel_deleted",({_id:data._id,message:"channel_no_longer_exist"}));
        await channel.deleteOne();
    }catch(err){
        throw err;
    }
}










//toggle like notification
//helps when admin send messge or creator they can mute sound


export const toggleNotification=async(data:{_id:string,senderId:string},socket:Socket)=>{
    try{
        const channel=await channels.findById(data._id);
        if(!channel){
            throw new Error("channel not found");
        }
        const notification=channel.muteNotification.some(
            (id=>id.toString()===data.senderId.toString())
        );
        if(notification){
            channel.muteNotification=channel.muteNotification.filter(
                (id)=>id.toString()!==data.senderId.toString()
            );
        }else{
            channel.muteNotification.push(new mongoose.Types.ObjectId(data.senderId));
        }
        await channel.save();
        const msg=notification?"unmute notification":"mute notification";
        socket.emit("toggle_channel_notification",({_id:data._id,message:msg}));
    }catch(err){
        throw err;
    }
}









//but when user search we have to show just we have to hide it from there
export const hideFromUserScreen=async(data:
    {_id:string,senderId:string},
    socket:Socket,io:Server,
    users:{[key:string]:string}
)=>{
    try{
        const channel=await channels.findById(data._id);
        if(!channel){
            throw new Error("channel not found");
        }
        channel.hideIt.push(new mongoose.Types.ObjectId(data.senderId));
        await channel.save();


       //here now we fetch the channel panel again  and send to user 


       await showRandomChannels({senderId:data.senderId},socket,io,users)
    }catch(err){
        throw err;
    }
}







//first we will show all the channels up to 10 random category 
//when user click see all then we will filter it according to the filter


export const showRandomChannels=async(data:{senderId:string},socket:Socket,io:Server,users:{[key:string]:string})=>{
    try{
        const channel=await channels.find(
            {hideIt:{$nin:[data.senderId]},
            channelCreator:{$ne:data.senderId},
            followers:{$ne:data.senderId}}
        ).limit(10);
        socket.emit("got_all_random_channels",(channel));
    }catch(err){
        throw err;
    }
}










//based on category now we have to send data to user to user based on limits and page


export const categoryData=async(data:
    {category:string,page:number,limit:number,
    senderId:string},
    socket:Socket
)=>{
    try{
        const skip=(data.page-1)*data.limit;

        const channel=await channels.aggregate(
            [
                {
                    $match:{
                        category:data.category,

                        $nor:[
                            {followers:new mongoose.Types.ObjectId(data.senderId)},
                            {channelCreator:new mongoose.Types.ObjectId(data.senderId)},
                        ],
                    },
                },
                {
                    $addFields:{
                        followersCount:{$size:"$followers"}
                    },
                },
                {
                   $sort:{followersCount:-1},  
                },
                {
                    $skip:skip,
                },
                {
                    $limit:data.limit,
                },
                {
                    $project:{
                        followers:0,
                        hideIt:0,
                        admin:0,
                    },
                },
            ],
        );
        socket.emit("category_data",(channel));
    }catch(err){
        throw err;
    }
}










//remove from admin


export const removeAdmin=async(data:
    {_id:string,senderId:string,receiverId:string},
    socket:Socket,io:Server,users:{[key:string]:string},
)=>{
    try{
        const channel=await channels.findById(data._id);
        if(!channel){
            throw new Error("channel not found");
        }
        //we will check id it is admin if not then we will not emit to receiver
        if(channel.channelCreator.toString()!==data.senderId.toString()){
            throw new Error("don't have access to remove admin");
        }
        const isAdmin=channel.admin.some(
            (id)=>id.toString()===data.receiverId.toString()
        );
        if(isAdmin){
            channel.admin=channel.admin.filter(
                (id)=>id.toString()!==data.receiverId.toString()
            );
        }
        await channel.save();

        //now here we will call the function 
    }catch(err){
        throw err;
    }
}










export const profileData=async(data:{_id:string,senderId:string},socket:Socket)=>{
    try{
        const channel=await channels.findById(data._id);
        if(!channel){
            throw new Error("channel not found");
        }
        //using populate to get data as to show to admin name of admin
        await channel.populate("admin","name profilePic");

        socket.emit("profile_data",(channel));
        //we will fetch group creator id and show him the group settings and admin data
    }catch(err){
        throw err;
    }
}











export const getChannelFollowers=async(data:{channelId:string,senderId:string},socket:Socket)=>{
    try{
        const channel=await channels.findById(data.channelId);
        if(!channel){
            throw new Error("channel not found");
        }
        if(channel.channelCreator.toString()!==data.senderId.toString()){
            throw new Error("don't have access to view the followers list");
        }
       await channel.populate("followers","name profilePic");
       socket.emit("channel_followers_list",(channel.followers));
    }catch(err){
        throw err;
    }
}














export const canSendMessage=async(data:{channelId:string,senderId:string},socket:Socket)=>{
    try{
        const channel=await channels.findById(data.channelId);
        if(!channel){
            throw new Error("channel not found");
        }
        //here we check is Admin or creator then only he can send message

        const isAdmin=channel.admin.some(
            (id)=>id.toString()===data.senderId.toString()
        );
        if(isAdmin){
            const msg="canSend";
            socket.emit("canSendMessage",(msg));
        }else{
            const msg="cannotSend";
            socket.emit("canSendMessage",(msg));
        }
    }catch(err){
        throw err;
    }
}