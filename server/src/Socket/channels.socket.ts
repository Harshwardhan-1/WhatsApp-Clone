import {Socket,Server} from 'socket.io';
import { create_channel, showRandomChannels, allUserChannel, toggleFollow, hideFromUserScreen, categoryData, canSendMessage } from '../controllers/channels.management.controller';

export const channelsSocket=async(socket:Socket,io:Server,users:{[key:string]:string},activeChats:Record<string,string>,activeChannels:Record<string,string>)=>{
        try{
           socket.on("create_channel",async(data)=>{
            try{ await create_channel(data,socket,io,users); }
            catch(err){ const error=err instanceof Error?err.message:"Unknown Error"; socket.emit("channels_error",(error)); }
           });

           socket.on("random_channels",async(senderId:string)=>{
            try{ await showRandomChannels({senderId},socket,io,users); }
            catch(err){ const error=err instanceof Error?err.message:"Unknown Error"; socket.emit("channels_error",(error)); }
           });

           socket.on("all_user_channel",async(senderId:string)=>{
            try{ await allUserChannel({senderId},socket); }
            catch(err){ const error=err instanceof Error?err.message:"Unknown Error"; socket.emit("channels_error",(error)); }
           });

           socket.on("toggle_channel_follow",async(data)=>{
            try{ await toggleFollow(data,socket,io,users); }
            catch(err){ const error=err instanceof Error?err.message:"Unknown Error"; socket.emit("channels_error",(error)); }
           });

           socket.on("hide_channel",async(data)=>{
            try{ await hideFromUserScreen(data,socket,io,users); }
            catch(err){ const error=err instanceof Error?err.message:"Unknown Error"; socket.emit("channels_error",(error)); }
           });

           socket.on("category_data",async(data)=>{
            try{ await categoryData(data,socket); }
            catch(err){ const error=err instanceof Error?err.message:"Unknown Error"; socket.emit("channels_error",(error)); }
           });


           socket.on("can_send_message",async(data)=>{
            try{
                await canSendMessage(data,socket);
            }catch(err){
                const error=err instanceof Error?err.message:"Unknown Error";
                socket.emit("channel_error",(error));
            }
           });

        }catch(err){
            throw err;
        }
}