import {useState, useEffect } from "react";
import axios from 'axios';
import { env } from "../configs/env.config";
import { showApiError } from "../utils/showApiError";
import {socket} from '../utils/socket';

export interface ChatUser {
    _id: string;
    name: string;
    avatar?: string;
    status?: string;
}

export  function groupChatHook(senderId:string){
    const [users,setUsers]=useState<ChatUser[]>([]);

    useEffect(()=>{
        try{
            const fetch=async()=>{
               const res=await axios.get(`${env.backendUrl}/api/v1/chat/alluser`,{withCredentials:true});
               if(res.data.success){
                const allUsers = res.data.data.allUser;
                const otherUsers = allUsers.filter(
                (user: ChatUser) => user._id !== senderId
    );
    setUsers(otherUsers);
               }
            }
            fetch();
        }catch(err){
            showApiError(err);
        }
    },[]);
    
    
    const createGroup=(data:{groupName:string,senderId:string,peoplesId:string[]})=>{
        socket.emit("create_group",(data));
    }
    return {users,createGroup};
}