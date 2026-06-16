import { Server } from "socket.io";
import {Server as httpServer} from "http";
import { PersonalChat } from "../controllers/chat.controller";
import { error } from "console";

export const userChat=(server:httpServer,FRONTEND_URL:string)=>{
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
        console.log("joined",userId)  
    })
    socket.on("send_message",(data)=>{
        try{
        const savedMessage=PersonalChat(data);
        const receiverSocketId=users[data.receiverId];
        if(receiverSocketId){
            io.to(receiverSocketId).emit("receive_message",savedMessage);
        }
        socket.emit("receive_message",savedMessage);
        }catch(err){
            const error=err instanceof Error ? err.message:"Unknown Error";
            socket.emit("chat_error",{
              message:"message sent failed",  
            })
        }
    })
    socket.on('disconnect',()=>{
        let disconnectUserId="";
        for(const id in users){
            if(users[id]===socket.id){
                disconnectUserId=users[id];
                delete users[disconnectUserId];
                break;
            }
        }
    }) 
});
}