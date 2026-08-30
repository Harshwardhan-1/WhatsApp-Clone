import {Socket,Server} from 'socket.io';
import { accepteCall, callingUser, endCall, Icecandidate, rejectCall } from '../controllers/call.controller';


export const callHandlers=async(socket:Socket,io:Server,users:{[key:string]:string},activeCalls:Record<string,{with:string,status:string}>)=>{
    try{
        socket.on("call_user",async(data:{senderId:string,receiverId:string,offer:RTCSessionDescriptionInit,callType:string})=>{
            await callingUser(data,socket,io,users,activeCalls);
        });


        socket.on("call_accepted",(data:{senderId:string,receiverId:string,answer:RTCSessionDescriptionInit,callType:string})=>{
            accepteCall(data,socket,io,users,activeCalls)
        });


        socket.on("call_rejected",(data:{senderId:string,receiverId:string})=>{
            rejectCall(data,socket,io,users,activeCalls);
        });


        
        socket.on("end_call",async(data:{senderId:string,receiverId:string})=>{
            await endCall(data,socket,io,users,activeCalls);
        });

        socket.on("ice_candidate",async(data:{senderId:string,receiverId:string,candidate:RTCIceCandidateInit})=>{
            await Icecandidate(data,socket,io,users);
        });
    }catch(err){
        const error=err instanceof Error?err.message:"Unknown Error";
        socket.emit("call_error",(error));
    }
}