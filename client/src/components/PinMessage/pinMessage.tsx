import { showMessage } from '../../utils/messageToast';
import {socket} from '../../utils/socket';
import { useState, useEffect } from 'react';

interface pinMessage{
    _id:string,
    senderId:string,
    receiverId:string,
    message:string,
    messageType:string,
    createdAt:Date,
    updatedAt:Date,
}


export function PinMessage(senderId:string,receiverId:string){
    const [pinData,setPinData]=useState<pinMessage[]>([]);

    const handlePin=async(data:pinMessage[])=>{
        try{
            setPinData(data);
        }catch(err:any){
            showMessage(err);
        }
    }
 
    useEffect(()=>{
        if(!senderId || !receiverId)return;
        socket.emit("allPinnedMessage",({senderId,receiverId}));
        socket.on("all_pinned",handlePin);
        return()=>{
            socket.off("all_pinned",handlePin);
        }

    },[senderId,receiverId]);
   const pinMessage=(data:{_id:string,senderId:string,receiverId:string})=>{
    socket.emit("pin_message",(data));
   } 

   const unpinnedMessage=(data:{_id:string,senderId:string,receiverId:string})=>{
    socket.emit("unpinned_message",(data));
   }
   return {pinMessage,unpinnedMessage,pinData};
}