import { useState,useEffect } from "react";
import { socket } from "../utils/socket";
import { PrevMsg } from "../services/chat.service";
import { useLocation } from "react-router-dom";
import { showApiError } from "../utils/showApiError";
import { userPresence } from "../services/user.presence.service";


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
interface error{
    msg:string,
}

interface handleData{
    userId:string,
    Date:string,
    createdAt:string,
    updatedAt:string,
}


export function ChatTalk(){
    const location=useLocation();
    const {messages}=PrevMsg();
    const [message,setMessage]=useState<MessageItem[]>([]);
    const [status,setStatus]=useState("offline");
    const [presence,setPresence]=useState<string>("");
    const locadata=location.state?.data;

    const handleError=(err:error)=>{
        showApiError(err);
    }
    
    const handleStatus=(data:{userId:string,status:string})=>{
        if(data.userId=== locadata?._id){
            setStatus(data.status);
        }
    }


    const handlePresence=(data:handleData)=>{
        if(!data.updatedAt)return;
        setPresence(userPresence(data.updatedAt));
    }


    useEffect(()=>{
        socket.on('receive_message',(data:Message)=>{
            setMessage(prev=>[...prev,{senderId:data.senderId,receiverId:data.receiverId,message:data.message,createdAt:data.createdAt,updatedAt:data.updatedAt}]);
        });
        socket.on('error_msg',handleError);
        socket.on("trigger_status",handleStatus);
        socket.emit("user_last_visit",(locadata?._id));
        socket.on("user_presence",handlePresence);
        return()=>{
         socket.off("receive_message");
         socket.off("trigger_status");
         socket.off("user_presence");
         socket.off("user_last_visit");
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

    const userpresence=(receiverId:string)=>{
        socket.emit("check_status",receiverId);
    }
    return {userMessage,allMessages,userpresence,status,presence};
}