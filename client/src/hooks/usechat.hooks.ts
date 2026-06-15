import { useEffect,useState } from "react";
import { showApiError } from "../utils/showApiError";
import { env } from "../configs/env.config";
import axios from "axios";


interface data{
    _id:string,
    name:string,
    email:string,
}

interface currentUser{
 loginUserId:string,
 email:string,
}

export function ShowAllUser(){
    const [data,setData]=useState<data[]>([]);
    const [userData,setUserData]=useState<currentUser>();
    try{
    useEffect(()=>{
        const fetch=async()=>{
            const response=await axios.get(`${env.backendUrl}/api/v1/chat/alluser`,{withCredentials:true});
            if(response.data.success===true && response.data.message=== 'all users'){
                setData(response.data.data.allUser);
                setUserData(response.data.userData);
            }
        }
  fetch();
    },[]);
}catch(err){
showApiError(err);
}
return {data,userData};
}
