import { useLocation } from "react-router-dom";
import { useState,useEffect } from "react";
import axios from 'axios';
import { showApiError } from "../utils/showApiError";
import { env } from "../configs/env.config";


interface prevMsg{
    senderId:string,
    receiverId:string,
    message:string,
    createdAt:Date,
}
export function PrevMsg(){
    const location=useLocation();
    const data=location.state?.data;const data2=location.state?.data2;
    const senderId=data2.loginUserId;
    const receiverId=data._id;


    const [messages,setMessages]=useState<prevMsg[]>([]);
    useEffect(()=>{
        try{
        if(!data2.loginUserId || !data._id)return;
        const fetch=async()=>{
            const send={senderId,receiverId};
            const response=await axios.post(`${env.backendUrl}/api/v1/chat/prevChat`,send,{withCredentials:true});
            if(response.data.success=== true && response.data.message=== 'got all chat'){
                setMessages(response.data.data);
            }
        }
        fetch();
        }catch(err){
            showApiError(err);
        };
    },[data2.loginUserId,data._id,senderId,receiverId]);

    return {messages};
}