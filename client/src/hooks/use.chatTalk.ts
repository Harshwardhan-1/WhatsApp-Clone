//message hook convey user message message to backend
import { useState,useEffect } from "react";
import { socket } from "../utils/socket";
import { PrevMsg } from "../services/chat.service";


interface MessageItem{
    senderId:string,
    receiverId:string,
    message:string,
    createdAt:Date,
    updatedAt:Date,
}
interface Message{
    senderId:string,
    receiverId:string,
    message:string,
    createdAt:Date,
    updatedAt:Date,
}
export function ChatTalk(){
    const {messages}=PrevMsg();
    const [message,setMessage]=useState<MessageItem[]>([]);




    useEffect(()=>{
        socket.on('receive_message',(data:Message)=>{
            setMessage(prev=>[...prev,{senderId:data.senderId,receiverId:data.receiverId,message:data.message,createdAt:data.createdAt,updatedAt:data.updatedAt}]);
        });
        return()=>{
         socket.off("receive_message");
        };
    },[]);
    const allMessages=[...messages,...message];



    const userMessage=(data:{senderId:string,receiverId:string,msg:string})=>{
        if(!data.senderId || !data.receiverId){
            alert("some field is missing");
            return;
        }
        socket.emit("send_message",data);
    };
    return {userMessage,allMessages};
}