// import { useLocation } from "react-router-dom";
// import { useState,useEffect } from "react";
import axios from 'axios';
import { showApiError } from "../utils/showApiError";
import { env } from "../configs/env.config";

export async function prevMsg(senderId:string,receiverId:string){
    try{
    const send={senderId,receiverId};
    const response=await axios.post(`${env.backendUrl}/api/v1/chat/prevChat`,send,{withCredentials:true});
    if(response.data.message=== 'got all chat'){
        return response.data.data;
    }
}catch(err){
    showApiError(err);
}
}
