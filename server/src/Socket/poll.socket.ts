import { Server, Socket } from 'socket.io';
import {
    addPoll,
    toggleLike,
    toggleLikeMultiple,
    updateTitleName,
    viewVotes,
    getPollDetails,
} from '../controllers/poll.controller';

export const registerPollSocketHandlers=(
    socket:Socket,
    io:Server,
    users:{[key:string]:string},
    activeGroupChats:Record<string,string>,
)=>{

    socket.on("create_poll",async(data:any)=>{
        try{
            await addPoll(data,socket,io,users,activeGroupChats);
        }catch(err:any){
            socket.emit("poll_error",{message:err.message || "error in creating poll"});
        }
    });

    socket.on("toggle_poll_vote",async(data:{_id:string,msgId:string,pollId:string,senderId:string})=>{
        try{
            await toggleLike(data,socket,io,users,activeGroupChats);
        }catch(err:any){
            socket.emit("poll_error",{message:err.message || ""});
        }
    });

    socket.on("toggle_poll_vote_multiple",async(data:{_id:string,msgId:string,pollId:string,senderId:string})=>{
        try{
            await toggleLikeMultiple(data,socket,io,users,activeGroupChats);
        }catch(err:any){
            socket.emit("poll_error",{message:err.message || ""});
        }
    });

    socket.on("update_poll_title",async(data:{_id:string,msgId:string,pollId:string,senderId:string,title:string})=>{
        try{
            await updateTitleName(data,socket,io,users,activeGroupChats);
        }catch(err:any){
            socket.emit("poll_error",{message:err.message || "title not updated"});
        }
    });

    socket.on("view_poll_votes",async(data:{_id:string,msgId:string,senderId:string})=>{
        try{
            await viewVotes(data,socket);
        }catch(err:any){
            socket.emit("poll_error",{message:err.message || "error in laoding votes"});
        }
    });

    socket.on("get_poll_details",async(data:{pollId:string,senderId:string})=>{
        try{
            await getPollDetails(data,socket);
        }catch(err:any){
            socket.emit("poll_error",{message:err.message || "poll data not found"});
        }
    });
}