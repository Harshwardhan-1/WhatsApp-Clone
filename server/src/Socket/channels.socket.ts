import {Socket,Server} from 'socket.io';
import { create_channel, sendChannelAcceptRequest, toggleFollow } from '../controllers/channels.management.controller';


export const channelsSocket=async(socket:Socket,io:Server,users:{[key:string]:string},activeChats:Record<string,string>)=>{
        try{
           socket.on("create_channel",async(data)=>{
            try{
                await create_channel(data,socket,io,users);
            }catch(err){
                const error=err instanceof Error?err.message:"Unknown Error";
                socket.emit("channels_error",(error));
            }
           });


           socket.on("handle_toggle_follow",async(data)=>{
            try{
                await toggleFollow(data,socket,io,users);
            }catch(err){
                const error=err instanceof Error?err.message:"Unknown Error";
                socket.emit("channels_error",(error));
            }
           });

           socket.on("hande_channel_accept_request",async(data)=>{
            try{
                await sendChannelAcceptRequest(data,socket,io,users,activeChats);
            }catch(err){
                const error=err instanceof Error?err.message:"Unknown Error";
                socket.emit("channels_error",(error));
            }
           });
        }catch(err){
            throw err;
        }
}