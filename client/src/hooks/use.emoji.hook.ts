import {socket} from '../utils/socket';

export function emojiOnMessages(senderId:string,receiverId:string){
    
    const setEmoji=async(data:{_id:string,senderId:string,receiverId:string,emojiData:string})=>{
        socket.emit("set_emoji",(data));
    };
    return {setEmoji};
}