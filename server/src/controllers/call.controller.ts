import {Socket,Server} from 'socket.io';
import { store_last_message } from './last.message.controller';
import { PersonalChat } from './chat.controller';



export const callingUser=async(data:
    {senderId:string,receiverId:string,offer:RTCSessionDescriptionInit,callType:string},
    socket:Socket,io:Server,
    users:{[key:string]:string},
    activeCalls:Record<string,{with:string,status:string}>,
)=>{
    try{
        const receiverSocketId=data.receiverId;
        const isUserOnline=users[receiverSocketId];
        if(!isUserOnline){
            socket.emit("call_failed",("user is offline"));
            return;
        }
        const isReceiverOnAnotherCall=activeCalls[receiverSocketId];
        if(isReceiverOnAnotherCall){
            socket.emit("call_failed",("user is busy on another call"));
            return;
        }
        const isSenderOnAnotherCall=activeCalls[data.senderId];
        if(isSenderOnAnotherCall){
            socket.emit("call_failed",("you are already on another call"));
            return;
        }
        activeCalls[data.senderId]={with:data.receiverId,status:"ringing"};
        activeCalls[data.receiverId]={with:data.senderId,status:"ringing"};

        if(isUserOnline){
            io.to(isUserOnline).emit("incoming_call",(
            {senderId:data.senderId,receiverId:data.receiverId,offer:data.offer,callType:data.callType}));
        }

        ///store last message as call
        const callMessage=data.callType==="video"?" 📹 Video call":"📞 Voice call";


        const lastMessage=await store_last_message(
            {senderId:data.senderId,receiverId:data.receiverId,msg:`${callMessage}`,messageType:"call"});

            if(isUserOnline){
                io.to(isUserOnline).emit("chat_list_update",lastMessage);
            }
            socket.emit("chat_list_update",(lastMessage));
            const personalMsgStoreData={
                senderId:data.senderId,
                receiverId:data.receiverId,
                msg:`${callMessage}`,
                messageType:"call",
                filename:"",
                orignalname:"",
                sizeInKb:0,
                sizeInMb:0,
            }


           const msg=await PersonalChat(personalMsgStoreData);
           if(isUserOnline){
            io.to(isUserOnline).emit("receive_message",(msg));
           }
           socket.emit("receive_message",(msg));
        }catch(err){
        throw err;
    }
} 









export const accepteCall=async(data:
    {senderId:string,receiverId:string,answer:RTCSessionDescriptionInit,callType:string},
    socket:Socket,io:Server,
    users:{[key:string]:string},
    activeCalls:Record<string,{with:string,status:string}>,
)=>{
    try{
        const call=activeCalls[data.receiverId];
        if(!call){
            socket.emit("call_failed",("call no longer exist"));
            return;
        }
        activeCalls[data.senderId].status="ongoing";
        activeCalls[data.receiverId].status="ongoing";

        const senderAvailable=users[data.senderId];
        if(senderAvailable){
            io.to(senderAvailable).emit("call_accepted_by_user",({senderId:data.senderId,receiverId:data.receiverId,answer:data.answer}));
        }
    }catch(err){
        throw err;
    }
}












export const rejectCall=async(data:
    {senderId:string,receiverId:string},
    socket:Socket,io:Server,
    users:{[key:string]:string},
    activeCalls:Record<string,{with:string,status:string}>,
)=>{
    try{
         delete activeCalls[data.receiverId];
         delete activeCalls[data.senderId];
         const senderId=users[data.senderId];
        if(senderId){
            io.to(senderId).emit("call_rejected_by_receiver",
            ({senderId:data.senderId,receiverId:data.receiverId}));
        }
    }catch(err){
        throw err;
    }
}








export const Icecandidate=(data:
    {senderId:string,receiverId:string,candidate:RTCIceCandidateInit},
    socket:Socket,io:Server,users:{[key:string]:string},
)=>{
    try{
        const receiverSocketId=users[data.receiverId];
        if(receiverSocketId){
            io.to(receiverSocketId).emit("ice_candidate_received",({senderId:data.senderId,receiverId:data.receiverId,candidate:data.candidate}))    
        }
    }catch(err){
        throw err;
    }
}










export const endCall=async(data:
    {senderId:string,receiverId:string},
    socket:Socket,io:Server,
    users:{[key:string]:string},
    activeCalls:Record<string,{with:string,status:string}>,
)=>{
    try{
        const receiverSocketId=users[data.receiverId];
        const senderSocketId=users[data.senderId];
        delete activeCalls[data.senderId];
        delete activeCalls[data.receiverId];
          
        if(receiverSocketId){
            io.to(receiverSocketId).emit("call_ended",({senderId:data.senderId,receiverId:data.receiverId}));
        }
        if(senderSocketId){
            io.to(senderSocketId).emit("call_ended",({senderId:data.senderId,receiverId:data.receiverId}));
        }
    }catch(err){
        throw err;
    }
}