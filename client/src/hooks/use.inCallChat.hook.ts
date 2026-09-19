import { useEffect, useState, useCallback } from "react";
import { socket } from "../utils/socket";

export interface ParentReply {
    parentId:string;
    message:string;
    senderId:string;
}

export interface ViewedByUser {
    _id:string;
    name?:string;
    username?:string;
}

export interface CallChatMessage {
    _id:string;
    callId:string;
    groupId:string;
    message:string;
    senderId:string | { _id:string; name?:string; username?:string };
    parentReply?:ParentReply[] | null;
    viewedBy:string[];
    toggleLike:string[];
    isEdited?:boolean;
    reaction:{ _id?:string; userId:string; emoji:string }[];
    createdAt?:string;
}

export function useInCallChat(callId:string | null, groupId:string | null, senderId:string){
    const [messages,setMessages]=useState<CallChatMessage[]>([]);
    const [viewedByList,setViewedByList]=useState<ViewedByUser[]>([]);
    
    useEffect(()=>{
        if(!callId || !groupId){ setMessages([]); return; }
        socket.emit("get_all_call_messages",{groupId,callId});
    },[callId,groupId]);

    useEffect(()=>{
        const handleAllMessages=(data:CallChatMessage[])=>setMessages(data);

        const handleNewMsg=(msg:CallChatMessage)=>{
            if(msg.callId===callId) setMessages(prev=>[...prev,msg]);
        };

        const handleDeleted=(data:{groupId:string;msgId:string;message:string})=>{
            setMessages(prev=>prev.map(m=>m._id===data.msgId?{...m,message:data.message}:m));
        };

        const handleUpdate=(data:{msgId:string;message:string})=>{
            setMessages(prev=>prev.map(m=>m._id===data.msgId?{...m,message:data.message,isEdited:true}:m));
        };

        const handleToggleUpdate=(data:{msgId:string;populateData:any})=>{
            const ids=(data.populateData?.toggleLike || []).map((u:any)=>typeof u==="object"?u._id:u);
            setMessages(prev=>prev.map(m=>m._id===data.msgId?{...m,toggleLike:ids}:m));
        };

        const handleReply=(data:{create:CallChatMessage})=>{
            setMessages(prev=>[...prev,data.create]);
        };
        const handleViewedBy=(msg:any)=>{
            setViewedByList(msg.viewedBy || []);
        };
        const handleReactionUpdate=(msg:CallChatMessage)=>{
            setMessages(prev=>prev.map(m=>m._id===msg._id?msg:m));
        };

        socket.on("groupCall_all_messages",handleAllMessages);
        socket.on("incallchatmsg",handleNewMsg);
        socket.on("callMsgDeleted",handleDeleted);
        socket.on("group_call_message_update",handleUpdate);
        socket.on("group_call_toggle_update",handleToggleUpdate);
        socket.on("group_call_reply",handleReply);
        socket.on("group_call_msg_viewedBy",handleViewedBy);
        socket.on("groupCallReactionUpdate",handleReactionUpdate);

        return ()=>{
            socket.off("groupCall_all_messages",handleAllMessages);
            socket.off("incallchatmsg",handleNewMsg);
            socket.off("callMsgDeleted",handleDeleted);
            socket.off("group_call_message_update",handleUpdate);
            socket.off("group_call_toggle_update",handleToggleUpdate);
            socket.off("group_call_reply",handleReply);
            socket.off("group_call_msg_viewedBy",handleViewedBy);
            socket.off("groupCallReactionUpdate",handleReactionUpdate);
        };
    },[callId]);

    const sendMessage=useCallback((message:string)=>{
        if(!callId||!groupId)return;
        socket.emit("create_call_msg",{callId,groupId,message,senderId});
    },[callId,groupId,senderId]);
    const sendReply=useCallback((message:string,parentMsg:CallChatMessage)=>{
        if(!callId||!groupId)return;
        const parentSenderId = typeof parentMsg.senderId==="object" ? parentMsg.senderId._id : parentMsg.senderId;
        socket.emit("reply_call_msg",{
            callId,
            groupId,
            message,
            senderId,
            parentId:{
                parentId:parentMsg._id,
                message:parentMsg.message,
                senderId:parentSenderId,
            },
        });
    },[callId,groupId,senderId]);

    const deleteMessage=useCallback((msgId:string)=>{
        if(!groupId)return;
        socket.emit("delete_call_msg",{groupId,msgId,senderId});
    },[groupId,senderId]);

    const editMessage=useCallback((msgId:string,message:string)=>{
        if(!groupId)return;
        socket.emit("update_call_msg",{groupId,msgId,senderId,message});
    },[groupId,senderId]);

    const toggleLike=useCallback((msgId:string)=>{
        if(!groupId)return;
        socket.emit("toggle_call_like",{groupId,msgId,senderId});
    },[groupId,senderId]);

    const toggleReaction=useCallback((msgId:string,emoji:string)=>{
        if(!groupId)return;
        socket.emit("react_call_msg",{groupId,msgId,senderId,emoji});
    },[groupId,senderId]);

    const markViewed=useCallback(()=>{
        if(!callId||!groupId)return;
        socket.emit("viewed_call_msg",{groupId,callId,senderId});
    },[callId,groupId,senderId]);

    const fetchViewedBy=useCallback((msgId:string)=>{
        if(!groupId)return;
        socket.emit("get_call_msg_viewedBy",{groupId,msgId,senderId});
    },[groupId,senderId]);

    return {
        messages,viewedByList,
        sendMessage,sendReply,deleteMessage,editMessage,
        toggleLike,toggleReaction,markViewed,fetchViewedBy,
    };
}