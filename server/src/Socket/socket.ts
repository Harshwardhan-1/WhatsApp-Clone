import { Server } from "socket.io";
import {Server as httpServer} from "http";
import { PersonalChat } from "../controllers/chat.controller";
import { userlastVisit } from "../controllers/chat.controller";
import { userlastpresence } from "../models/user.lastpresence.model";
import {edit,delete_from_me,delete_from_everyone } from "../controllers/chat.controller";



export const userChat=(server:httpServer,FRONTEND_URL:string)=>{
    try{
const io=new Server(server,{
  cors:{
    origin:FRONTEND_URL,
    methods:["POST","GET","DELETE","PUT"],
    credentials:true,
  }  
});
const users:{[key:string]:string}={};
io.on('connection',(socket)=>{
    console.log("connected:",socket.id);

    socket.on("join",(userId:string)=>{
        users[userId]=socket.id;
        io.emit("trigger_status",{userId,status:"online"});
        console.log("joined",userId)  
    })
    socket.on("send_message",async(data)=>{
        try{
        const savedMessage=await PersonalChat(data);
        const receiverSocketId=users[data.receiverId];
        if(receiverSocketId){
            io.to(receiverSocketId).emit("receive_message",savedMessage);
        }
        socket.emit("receive_message",savedMessage);
        }catch(err){
            const error=err instanceof Error ?err.message:"Unknown Error"
            socket.emit("error_msg",error);
        }
    });
    
    socket.on("check_status",(receiverId)=>{
     if(users[receiverId]){
        socket.emit("trigger_status",{userId:receiverId,status:"online"});
     }else{
        socket.emit("trigger_status",{userId:receiverId,status:"offline"});
     }
    });

    //we receive receiver id here
    socket.on('user_last_visit',async(userId)=>{
        const lastvisit=await userlastpresence.findOne({userId});
        if(lastvisit){
            socket.emit("user_presence",lastvisit);
        }
    })

    //operations

    //delete for everyone logic
    socket.on("delete_from_everyone",async(data:{_id:string,senderId:string,receiverId:string})=>{
        try{
        await delete_from_everyone(data._id);
        const receiverSocketId=users[data.receiverId];
        if(receiverSocketId){
            io.to(receiverSocketId).emit("deleted_everyone",{messageId:data._id,senderId:data.senderId,receiverId:data.receiverId})
        }
        socket.emit("deleted_everyone",{messageId:data._id,senderId:data.senderId,receiverId:data.receiverId});
        }catch(err){
            socket.emit("error_msg",err);
        }
    });

    //update/edit 
    socket.on("edit_message",async(data:{_id:string,senderId:string,receiverId:string,msg:string})=>{
        try{
        const editData=await edit({_id:data._id,msg:data.msg});
        const receiverSocketId=users[data.receiverId];
        if(receiverSocketId){
            io.to(receiverSocketId).emit("message_edited",{messageId:data._id,senderId:data.senderId,receiverId:data.receiverId,msg:editData.message});
        }
        socket.emit("message_edited",{messageId:data._id,senderId:data.senderId,receiverId:data.receiverId,msg:editData.message});
        }catch(err){
            socket.emit("error_msg",{msg:"fail it edit message"});
        } 
    });

    //delete for me
    socket.on("delete_from_me",async(data:{_id:string,senderId:string,receiverId:string})=>{
        try{
          await delete_from_me({_id:data._id,senderId:data.senderId,receiverId:data.receiverId});
            const currentUserSocketId=users[data.senderId];
            if(currentUserSocketId){
                io.to(currentUserSocketId).emit("delete",{messageId:data._id,senderId:data.senderId,receiverId:data.receiverId});
            }
            socket.emit('delete',{messageId:data._id,senderId:data.senderId,receiverId:data.receiverId});
        }catch(err){
            socket.emit("error_msg",{msg:"error in deleting message"});
        }
    });



    //operations end
    socket.on('disconnect',async()=>{
        console.log("disconected",socket.id);
        let disconnectUserId="";
        for(const id in users){
            if(users[id]===socket.id){
               const saveLastPresence=await userlastVisit({userId:id});
                io.emit("trigger_status",{userId:id,status:"offline"});
                io.emit("user_presence",saveLastPresence);
                disconnectUserId=id;
                delete users[disconnectUserId];
                break;
            }
        }
    });
});
    }catch(err){
        throw err;
    }
}