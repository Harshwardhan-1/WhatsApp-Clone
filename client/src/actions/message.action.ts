import { socket } from "../utils/socket";
import { showApiError } from "../utils/showApiError";
interface DeleteForEveryone{
   _id:string,
    senderId:string,
    receiverId:string,
}

export function MessageAction(){
const deleteForEveryone=(data:DeleteForEveryone)=>{
    socket.emit("delete_from_everyone",data);
}
const delete_from_me=(data:DeleteForEveryone)=>{
    socket.emit("delete_from_me",data);
}
const update_message=(data:{_id:string,senderId:string,receiverId:string,msg:string})=>{
    if(data.msg=== ''){
        showApiError("msg cannot be empty");
        return;
    }
    socket.emit("edit_message",data);
}
return {deleteForEveryone,delete_from_me,update_message};
}