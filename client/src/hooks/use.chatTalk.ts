import { useState,useEffect } from "react";
import { socket } from "../utils/socket";
import { prevMsg } from "../services/chat.service";
import { useLocation } from "react-router-dom";
import { showApiError } from "../utils/showApiError";
import { userPresence } from "../services/user.presence.service";


interface MessageItem{
    _id:string,
    senderId:string,
    receiverId:string,
    message:string,
    createdAt:Date,
    updatedAt:Date,
}
export interface Message{
    _id:string,
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
    const [allmessages,setAllMessages]=useState<MessageItem[]>([]);
    const [status,setStatus]=useState("offline");
    const [presence,setPresence]=useState<string>("");
    const locadata=location.state?.data;
    const data=location.state?.data;const data2=location.state?.data2;
    const senderId=data2.loginUserId;
    const receiverId=data._id;

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

    const handleDeleteEveryone=async(data:{messageId:string,senderId:string,receiverId:string})=>{
        setAllMessages(prev=>prev.filter(msg=>msg._id!==data.messageId));
    }

    const handleDelete=async(data:{messageId:string,senderId:string,receiverId:string})=>{
          setAllMessages(prev=>prev.filter(msg=>msg._id !== data.messageId));

    }

    const handleEdit=(data:{messageId:string,senderId:string,receiverId:string,msg:string})=>{
        setAllMessages(prev=>prev.map(msg=>msg._id === data.messageId? { ...msg, message: data.msg }:msg)
    );}
 
    useEffect(()=>{
        //calling old message
        const loadMessage=async()=>{
            if(!senderId || !receiverId)return;
            const data=await prevMsg(senderId,receiverId);
            if(data){
                setAllMessages(data);
            }
        };
        loadMessage();
        //end of fetch of old message
        socket.on('receive_message',(data:Message)=>{
           setAllMessages(prev => [...prev, data]);
        });
        socket.on('error_msg',handleError);
        socket.on("trigger_status",handleStatus);
        socket.emit("user_last_visit",(locadata?._id));
        socket.on("user_presence",handlePresence);
        socket.on("deleted_everyone",handleDeleteEveryone);
        socket.on("delete",handleDelete);
        socket.on("message_edited",handleEdit);
        return()=>{
         socket.off("receive_message");
         socket.off("trigger_status",handleStatus);
         socket.off("user_presence",handlePresence);
         socket.off("user_last_visit");
         socket.off("error_msg",handleError);
         socket.off("deleted_everyone",handleDeleteEveryone);
         socket.off("delete",handleDelete);
         socket.off("message_edited",handleEdit);
        };
    },[locadata?._id,senderId,receiverId]);



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
    return {userMessage,allmessages,userpresence,status,presence};
}