import {Socket,Server} from 'socket.io';
import { createGroup } from '../controllers/group.management.controller';


export const groupChat=async(socket:Socket,users:{[key:string]:string},io:Server,activeGroupChats:Record<string,string>)=>{
    try{
        socket.on("create_group",async(data)=>{
          const group=await createGroup(data);
          socket.emit("msg_emitted");
        });
    }catch(err){
        const error=err instanceof Error?err.message:"Unknown Error";
        socket.emit("err_msg",error);
    }
} 