import {Socket,Server} from 'socket.io';
import {
    groupCall,
    callRejected,
    callAccepted,
    leaveGroupCall,
    noResponseOfCall,
    cleanupUserFromCalls
} from '../controllers/group.call.controller';


export const groupCallSocket=async(
    socket:Socket,io:Server,
    users:{[key:string]:string},
    activeGroupChats:Record<string,string>
)=>{

    socket.on("create_group_call",async(data)=>{
        try{
            await groupCall(data,socket,io,users,activeGroupChats);
        }catch(err){
            const error=err instanceof Error?err.message:"Unknown Error";
            socket.emit("group_call_error",error);
        }
    });


    socket.on("group_call_rejected_by_user",async(data)=>{
        try{
            await callRejected(data,socket,io,users);
        }catch(err){
            const error=err instanceof Error?err.message:"Unknown Error";
            socket.emit("group_call_error",error);
        }
    });


    socket.on("group_call_accepted",async(data)=>{
        try{
            await callAccepted(data,socket,io,users);
        }catch(err){
            const error=err instanceof Error?err.message:"Unknown Error";
            socket.emit("group_call_error",error);
        }
    });


    socket.on("leave_group_call",async(data)=>{
        try{
            await leaveGroupCall(data,socket,io,users);
        }catch(err){
            const error=err instanceof Error?err.message:"Unknown Error";
            socket.emit("group_call_error",error);
        }
    });


    socket.on("group_call_no_response",async(data)=>{
        try{
            await noResponseOfCall(data,socket,io,users);
        }catch(err){
            const error=err instanceof Error?err.message:"Unknown Error";
            socket.emit("group_call_error",error);
        }
    });
    socket.on("disconnect",async()=>{
        try{
            const disconnectedUserId=Object.keys(users).find(
                (uid)=>users[uid] ===socket.id
            );
            if(disconnectedUserId){
                await cleanupUserFromCalls(disconnectedUserId, io, users);
            }
        }catch(err){
            console.error("group call disconnect cleanup failed:", err);
        }
    });

};