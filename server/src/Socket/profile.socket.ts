import { Socket } from "socket.io";
import { clear_chat } from "../controllers/profile.controller";
import { updateLastMessage } from "../controllers/last.message.controller";
import { get_last_message } from "../controllers/last.message.controller";

export const profileSocket=(socket:Socket)=>{
try{
    socket.on("clear_chat",async(data:{senderId:string,receiverId:string})=>{
        await clear_chat({senderId:data.senderId,receiverId:data.receiverId});
        socket.emit("chat_cleared",({senderId:data.senderId,receiverId:data.receiverId}));
        
        
        //here update last message
        await updateLastMessage({senderId:data.senderId,receiverId:data.receiverId});

        //getLastMessage

        const allLastMessage=await get_last_message({userId:data.senderId});
         socket.emit("all_last_message",allLastMessage);

    });
}catch(err){
    const error=err instanceof Error ?err.message:"Unknown Error"
     socket.emit("error_msg",error);
}
}