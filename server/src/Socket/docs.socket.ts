import {Socket,Server} from 'socket.io';
import {docsLeave} from "../controllers/docs.controller";

export const docsSocket=async(socket:Socket,io:Server,
    users:{[key:string]:string},activeChats:Record<string,string>,
    activeDocs:Record<string,string>
)=>{
    try{
        socket.on("active_docs",(data:{docsId:string,senderId:string})=>{
        activeDocs[data.senderId]=data.docsId;
    });

        socket.on("not_active_docs",(data:{docsId:string,senderId:string})=>{
        delete activeDocs[data.senderId];
        docsLeave(data,socket);
    });



    socket.on("disconnect",async()=>{
        for(const room of socket.rooms){
            if(room.startsWith("doc:")){
                socket.nsp.to(room).emit("docs_online",({
                    docsId:room.slice(4),
                    size:socket.nsp.adapter.rooms.get(room)?.size || 0,
                }));
            }
        }
    });

    }catch(err){
        const error=err instanceof Error?err.message:"Unknown Error";
        socket.emit("docs_error",(error));
    }
}