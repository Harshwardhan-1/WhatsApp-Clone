import {Server,Socket} from 'socket.io';
import { emojiOnMessage } from '../controllers/emoji.controller';

export const emojiOnMessages=async(socket:Socket,users:{[key:string]:string},io:Server)=>{
    try{
        socket.on("set_emoji",async(data:{_id:string,senderId:string,receiverId:string,emojiData:string})=>{
            try{
             const updateMessage=await emojiOnMessage({_id:data._id,senderId:data.senderId,receiverId:data.receiverId,emojiData:data.emojiData});
            socket.emit("emoji_updated",(updateMessage));
            const receiverSocketId=users[data.receiverId];
            if(receiverSocketId){
                io.to(receiverSocketId).emit("emoji_updated",(updateMessage));
            }
            }catch(err){
                throw new Error("failed to set Emoji");
            }
        });
    }catch(err){
        const error=err instanceof Error?err.message:"Unknown Error";
        socket.emit("error_msg",error);
    }
}