import { Server } from "socket.io";
import {Server as httpServer} from "http";
import { isSend,isDelievered, PersonalChat } from "../controllers/chat.controller";
import { userlastVisit } from "../controllers/chat.controller";
import { userlastpresence } from "../models/user.lastpresence.model";
import {edit,delete_from_me,delete_from_everyone } from "../controllers/chat.controller";
import { user_online,user_open_chat,markIsSeen } from "../controllers/chat.controller";



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
let activeChats:Record<string,string>={};
io.on('connection',(socket)=>{
    console.log("connected:",socket.id);

    socket.on("join",(userId:string)=>{
        users[userId]=socket.id;
        io.emit("trigger_status",{userId,status:"online"});
        console.log("joined",userId)  
    });











    socket.on("active_user",(data:{senderId:string,receiverId:string})=>{
        activeChats[data.senderId]=data.receiverId;
    });
    socket.on("not_active_user",(data:{senderId:string,receiverId:string})=>{
        delete activeChats[data.senderId];
    })
    socket.on("send_message",async(data)=>{
        try{
        const savedMessage=await PersonalChat(data);
        const receiverSocketId=users[data.receiverId];
        if(receiverSocketId){
            io.to(receiverSocketId).emit("receive_message",savedMessage); 
            if(activeChats[data.receiverId]===data.senderId){
               const mark=await markIsSeen({_id:savedMessage._id,senderId:savedMessage.senderId,receiverId:savedMessage.receiverId});
               io.to(users[data.senderId]).emit("real_time_isSeen",mark);
            }else{
            const msgDeliveredTick=await isDelievered({_id:savedMessage._id,senderId:savedMessage.senderId,receiverId:savedMessage.receiverId});
            if(users[data.senderId]){
            io.to(users[data.senderId]).emit("isDelivered",msgDeliveredTick);
            }
            }
        }else{
          const assignIsSend=await isSend({_id:savedMessage._id,senderId:savedMessage.senderId,receiverId:savedMessage.receiverId});
          socket.emit("isSend",assignIsSend);
        }
        socket.emit("receive_message",savedMessage);
        }catch(err){
            const error=err instanceof Error ?err.message:"Unknown Error"
            socket.emit("error_msg",error);
        }
    });


  

   //in data it contains userId
  socket.on("user_online",async(data:{userId:string})=>{
    try{
        const messages=await user_online({userId:data.userId});
        const grouped:Record<string,string[]>={};
        for(const message of messages){
            //make a box of it if it not exists
            if(!grouped[message.senderId]){
                grouped[message.senderId]=[];
            }
            grouped[message.senderId].push(message._id.toString());
        }
        for(const senderId in grouped){
            const senderSocketId=users[senderId];
            if(senderSocketId){
                //all message of particular user will be send to it
                io.to(senderSocketId).emit("isDelivered_mark",{messageIds:grouped[senderId]});
            }
        }
    }catch(err){
        const error=err instanceof Error ?err.message:"Unknown Error"
        socket.emit("error_msg",error);
    }
  });



  socket.on("user_open_chat",async(data:{senderId:string,receiverId:string})=>{
    const message=await user_open_chat({senderId:data.senderId,receiverId:data.receiverId});
    const receiverSocketId=users[data.receiverId];
    if(receiverSocketId){
        io.to(receiverSocketId).emit("isSeenStatus",message);
    }
  })







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