import { socket } from "../utils/socket";

export function chatPageOption(){
    const clearChat=(data:{senderId:string,receiverId:string})=>{
        socket.emit("clear_chat",data);
    }
    return {clearChat};
}