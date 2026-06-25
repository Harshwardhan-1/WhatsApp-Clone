import { Server } from "socket.io";
import {Server as httpServer} from "http";
import { PersonalChat } from "../controllers/chat.controller";
import { userlastVisit } from "../controllers/chat.controller";
import { userlastpresence } from "../models/user.lastpresence.model";



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

    //we receiver receiver id here
    socket.on('user_last_visit',async(userId)=>{
        const lastvisit=await userlastpresence.findOne({userId});
        if(lastvisit){
            socket.emit("user_presence",lastvisit);
        }
    })


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