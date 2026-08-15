import { Socket,Server } from "socket.io";
import { clear_chat } from "../controllers/profile.controller";
import { updateLastMessage } from "../controllers/last.message.controller";
import { get_last_message } from "../controllers/last.message.controller";
import { alldocs, allLinks, disappearingMessage, media } from "../controllers/chat.controller";
import { currentDisapperingVal } from "../controllers/chat.controller";
import { PersonalChat } from "../controllers/chat.controller";
import { changeNotificationSetting, prev_mark_notification } from "../controllers/notification.controller";



export const profileSocket=(socket:Socket,users:{[key:string]:string},io:Server)=>{
try{
    //clear chat
    socket.on("clear_chat",async(data:{senderId:string,receiverId:string})=>{
        await clear_chat({senderId:data.senderId,receiverId:data.receiverId});
        socket.emit("chat_cleared",({senderId:data.senderId,receiverId:data.receiverId}));
        //here update last message
        await updateLastMessage({senderId:data.senderId,receiverId:data.receiverId});
        //getLastMessage
        const allLastMessage=await get_last_message({userId:data.senderId});
         socket.emit("all_last_message",allLastMessage);
    });

    const timer=(duration:string,message:string)=>{
        if(duration==="off"){
              return  message="turned off disappearing messages";
            }else if(duration==="24hrs"){
               return message=`turned on disappear messages New message will disappear from this chat ${duration}  after they are sent`;
            }else{
            return message=`turned on disappear messages New message will disappear from this chat ${duration}  after they are sent`;    
            }
    }

    //disappering message
    socket.on("disappear_message",async(data:{senderId:string,receiverId:string,duration:string})=>{
        try{
         const disappearMsg=await disappearingMessage({senderId:data.senderId,receiverId:data.receiverId,duration:data.duration});
         if(disappearMsg){
            let message="";
           message=timer(data.duration,message);
            const savedMessage=await PersonalChat({senderId:data.senderId,receiverId:data.receiverId,msg:message,messageType:"system"});
            if(savedMessage){
                const receiverSocketId=users[data.receiverId];
                if(receiverSocketId){
                    io.to(receiverSocketId).emit("disappear_message",{senderId:data.senderId,receiverId:data.receiverId,msg:`They ${savedMessage.message}`,messageType:"system",createdAt:savedMessage.createdAt,updatedAt:savedMessage.updatedAt});
                }
                socket.emit("disappear_message",{senderId:data.senderId,receiverId:data.receiverId,msg:`You ${savedMessage.message}`,messageType:"system",createdAt:savedMessage.createdAt,updatedAt:savedMessage.updatedAt});
            }
        }
        }catch(err){
         const error=err instanceof Error ?err.message:"Unknown Error"
         socket.emit("error_msg",error);
        }
    });


    socket.on("current_disappearing_val",async(data:{senderId:string,receiverId:string})=>{
        try{
      const duration=await currentDisapperingVal({senderId:data.senderId,receiverId:data.receiverId});
      socket.emit("disappearing_val",(duration));
        }catch(err){
            const error=err instanceof Error ?err.message:"Unknown Error"
           socket.emit("error_msg",error);
        }
    });



    //notification
    socket.on("prev_mark_notification",async(data:{senderId:string,receiverId:string})=>{
        try{
          const prev_duration=await prev_mark_notification({senderId:data.senderId,receiverId:data.receiverId});
          const isSenderOnline=users[data.senderId];
          if(isSenderOnline){
            const duration=prev_duration;
            socket.emit("already_mark_notification",(duration));
          }
        }catch(err){
            const error=err instanceof Error ?err.message:"Unknown Error"
             socket.emit("error_msg",error);
        }
    });


    socket.on("change_notification",async(data:{senderId:string,receiverId:string,duration:string})=>{
        try{
           await changeNotificationSetting({senderId:data.senderId,receiverId:data.receiverId,duration:data.duration});
           const duration=data.duration;
           socket.emit("notification_change",(duration));
        }catch(err){
            const error=err instanceof Error ?err.message:"Unknown Error";
            socket.emit("error_msg",error);
        }
    });
    socket.on("all_media",async(data:{senderId:string,receiverId:string})=>{
        try{
         const allMedia=await media({senderId:data.senderId,receiverId:data.receiverId});
         if(allMedia){
            socket.emit("found_allMedia",(allMedia));
         }
        }catch(err){
            const error=err instanceof Error?err.message:"Unknown Error";
            socket.emit("error_msg",error);
        }
    });

    socket.on("all_docs",async(data:{senderId:string,receiverId:string})=>{
        try{
          const allDocs=await alldocs({senderId:data.senderId,receiverId:data.receiverId});
          socket.emit("get_all_docs",(allDocs));
        }catch(err){
             const error=err instanceof Error?err.message:"Unknown Error";
             socket.emit("error_msg",error);
        }
    });

    socket.on("get_all_links",async(data:{senderId:string,receiverId:string})=>{
        try{
            const links=await allLinks({senderId:data.senderId,receiverId:data.receiverId});
            const senderId=users[data.senderId];
            if(senderId){
                socket.emit("all_links",links);
            }
        }catch(err){
            const error=err instanceof Error?err.message:"Unknown Error";
            socket.emit("error_msg",error);
        }
    });
}catch(err){
    const error=err instanceof Error ?err.message:"Unknown Error"
     socket.emit("error_msg",error);
}
}