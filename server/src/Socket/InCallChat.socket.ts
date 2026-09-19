import {Socket,Server} from 'socket.io';
import {
    createMsg,
    deleteMsg,
    updateMsg,
    toggleLike,
    reply,
    viewed,
    getAllViewed,
    allMessages,
    reaction
} from '../controllers/InCallChat.controller'; 

export const InCallSocket=async(
    socket:Socket,io:Server,
    users:{[key:string]:string},
    activeGroupChats:Record<string,string>
)=>{
    try{
        socket.on("create_call_msg", async (data) => {
            try { await createMsg(data, socket, io, users, activeGroupChats); }
            catch (err) { socket.emit("InCallChatError", err instanceof Error ? err.message : "Unknown Error"); }
        });

        socket.on("reply_call_msg", async (data) => {
            try { await reply(data, socket, io, users); }
            catch (err) { socket.emit("InCallChatError", err instanceof Error ? err.message : "Unknown Error"); }
        });

        socket.on("delete_call_msg", async (data) => {
            try { await deleteMsg(data, socket, io, users, activeGroupChats); }
            catch (err) { socket.emit("InCallChatError", err instanceof Error ? err.message : "Unknown Error"); }
        });

        socket.on("update_call_msg", async (data) => {
            try { await updateMsg(data, socket, io, users, activeGroupChats); }
            catch (err) { socket.emit("InCallChatError", err instanceof Error ? err.message : "Unknown Error"); }
        });

        socket.on("toggle_call_like", async (data) => {
            try { await toggleLike(data, socket, io, users, activeGroupChats); }
            catch (err) { socket.emit("InCallChatError", err instanceof Error ? err.message : "Unknown Error"); }
        });

        socket.on("react_call_msg", async (data) => {
            try { await reaction(data, socket, io, users); }
            catch (err) { socket.emit("InCallChatError", err instanceof Error ? err.message : "Unknown Error"); }
        });

        socket.on("viewed_call_msg", async (data) => {
            try { await viewed(data); }
            catch (err) { socket.emit("InCallChatError", err instanceof Error ? err.message : "Unknown Error"); }
        });

        socket.on("get_call_msg_viewedBy", async (data) => {
            try { await getAllViewed(data, socket); }
            catch (err) { socket.emit("InCallChatError", err instanceof Error ? err.message : "Unknown Error"); }
        });

        socket.on("get_all_call_messages", async (data) => {
            try { await allMessages(data, socket); }
            catch (err) { socket.emit("InCallChatError", err instanceof Error ? err.message : "Unknown Error"); }
        });

    }catch(err){
        socket.emit("InCallChatError", err instanceof Error ? err.message : "Unknown Error");
    }
}