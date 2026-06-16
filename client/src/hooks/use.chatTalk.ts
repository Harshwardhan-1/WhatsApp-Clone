//message hook convey user message message to backend
import { socket } from "../utils/socket";
export function chatTalk(){
    const userMessage=(data:{senderId:string,receiverId:string,msg:string})=>{
        if(!data.senderId || !data.receiverId)return;
        socket.emit("send_message",data);
    };
    return {userMessage};
}