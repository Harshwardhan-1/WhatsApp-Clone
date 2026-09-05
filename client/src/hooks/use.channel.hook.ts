import { useState, useEffect } from "react";
import { socket } from "../utils/socket";

interface ChannelMessage {
    _id: string;
    channelId: string;
    senderId: string;
    message: string;
    messageType: string;
    mimetype?: string;
    orignalname?: string;
    reaction?: { userId: string; emoji: string }[];
}

export function ChannelHook(channelId?: string, senderId?: string) {
    const [msg, setMsg] = useState<ChannelMessage[]>([]);

    const handleDelMsg=(data:{channelId:string,msgId:string})=>{
        if(data.channelId!==channelId)return;
        setMsg(prev=>prev.filter((m)=>m._id.toString()!==data.msgId.toString()))
    }

    const handleReceiveMessage = (data: ChannelMessage) => {
        if (data.channelId !== channelId) return; 
        setMsg(prev => {
            if (prev.some(m => m._id === data._id)) return prev;
            return [...prev, data];
        });
    };

    const handleDelMsgFromMe=async(data:{channelId:string,msgId:string})=>{
        if(data.channelId!==channelId)return;
        setMsg(prev=>prev.filter((m)=>m._id.toString()!==data.msgId.toString()));
    }

    const handleEdit=async(data:{channelId:string,msg:ChannelMessage})=>{
        if(data.channelId!==channelId)return;
        setMsg(prev=>prev.map(m=>m._id.toString()===data.msg._id.toString()?data.msg:m));
    }

    // emoji reaction update - server "msg" document seedha bhejta hai (channelId uske andar hota hai)
    const handleReactionUpdate = (data: ChannelMessage) => {
        if (data.channelId?.toString() !== channelId?.toString()) return;
        setMsg(prev => prev.map(m => m._id.toString() === data._id.toString() ? data : m));
    }

    useEffect(() => {
        if (!senderId || !channelId) return;
        setMsg([]);
        socket.emit("all_prev_msg", { channelId, senderId });
        const handleAllPrevMsg = (data: ChannelMessage[]) => {
            setMsg(data);
        };
        
        socket.on("got_all_prev_message", handleAllPrevMsg);
        socket.on("channel_receive_message", handleReceiveMessage);
        socket.on("deleted_channel_msg",handleDelMsg);
        socket.on("delete_channel_msg",handleDelMsgFromMe);
        socket.on("channel_msg_updated",handleEdit);
        socket.on("update_channel_emoji_reaction", handleReactionUpdate);

        return () => {
            socket.off("got_all_prev_message", handleAllPrevMsg);
            socket.off("channel_receive_message", handleReceiveMessage);
            socket.off("deleted_channel_msg",handleDelMsg);
            socket.off("delete_channel_msg",handleDelMsgFromMe);
            socket.off("channel_msg_updated",handleEdit);
            socket.off("update_channel_emoji_reaction", handleReactionUpdate);
        };
    }, [senderId, channelId]);

    const sendMessage=(data:{channelId: string;senderId:string; message:string }) => {
        socket.emit("channel_msg_creation", data);
    };

    const deleteForEveryone=(data:{channelId:string,senderId:string,msgId:string})=>{
        socket.emit("delete_channel_msg_permanently",(data));
    };

    const deleteForMe=async(data:{channelId:string,senderId:string,msgId:string})=>{
        socket.emit("delete_channel_msg_from_me",(data));
    }

    const editMsg=async(data:{channelId:string,senderId:string,msgId:string,message:string})=>{
        socket.emit("edit_channel_msg",(data));
    }

    const sendFileMsg=async(data:
        {channelId:string,senderId:string,message:string,messageType:string,
        mimetype:string,orignalname:string,sizeInKb?:number,sizeInMb?:number}
    )=>{
        socket.emit("channel_msg_creation",(data));
    }

    const sendReaction = (data: {channelId:string; msgId:string; senderId:string; emoji:string}) => {
        socket.emit("channel_reaction", data);
    };

    return { msg, editMsg, deleteForMe, deleteForEveryone, sendFileMsg, sendMessage, sendReaction };
}