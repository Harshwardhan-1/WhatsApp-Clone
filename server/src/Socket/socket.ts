import { Server } from "socket.io";
import {Server as httpServer} from "http";

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
        users[userId]=userId;
        console.log("joined",userId)
    })
    socket.on('disconnect',()=>{
        console.log("disconnected:",socket.id); 
    })
});
}