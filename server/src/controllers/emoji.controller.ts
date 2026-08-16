import { personalChat } from "../models/chat.model";
import mongoose from 'mongoose';
export const emojiOnMessage=async(data:{_id:string,senderId:string,receiverId:string,emojiData:string})=>{
    try{
        const findMsg=await personalChat.findById(data._id);
        if(!findMsg){
            throw new Error("msg not exist to apply emoji");
        }
        const AlreadyMark=findMsg.reaction?.find(
            (ids)=>ids.userId.toString()===data.senderId
        );
    
        if(AlreadyMark){
          if(AlreadyMark.emoji===data.emojiData){
            //filter
            findMsg.reaction=findMsg.reaction?.filter(
                (id)=>id.userId.toString()!==data.senderId
            );
          }else{
            AlreadyMark.emoji=data.emojiData;
          }
          await findMsg.save();
          return findMsg;
        }
        const id=new mongoose.Types.ObjectId(data.senderId);
        findMsg.reaction?.push({userId:id,emoji:data.emojiData});
        await findMsg.save();
        return findMsg;
    }catch(err){
        throw new Error("failed to apply emoji on message");
    }
}