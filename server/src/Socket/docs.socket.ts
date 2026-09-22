import { Socket, Server } from "socket.io";
import {
    create,
    AllDocs,
    userOpenDocs,
    updateDocs,
    docsLeave,
    sendEditRequest,
    showAllEditRequest,
    updatePermission,
    downloadDocsFile,
    deleteDocs,
    updateDoc,
} from "../controllers/docs.controller";
import type { createDocs } from "../types/docs.types";

export const docsSocket = (
    socket: Socket,
    io: Server,
    users: { [key: string]: string },
    activeChats: Record<string, string>,
    activeDocs: Record<string, string>
) => {
    const safe =
        <T>(fn: (data: T) => Promise<unknown> | unknown) =>
        async (data: T) => {
            try {
                await fn(data);
            } catch (err) {
                socket.emit("docs_error", err instanceof Error ? err.message : "Unknown Error");
            }
        };

    socket.on("create_docs", safe((data: createDocs) => create(data, socket, io, users, activeChats)));
    socket.on("get_all_docs", safe((data: { senderId: string }) => AllDocs(data, socket)));
    socket.on("active_docs", (data: { docsId: string; senderId: string }) => {
        activeDocs[data.senderId] = data.docsId;
    });

    socket.on(
        "not_active_docs",
        safe(async (data: { docsId: string; senderId: string }) => {
            if (activeDocs[data.senderId] === data.docsId) delete activeDocs[data.senderId];
            await docsLeave(data, socket);
        })
    );

    socket.on("user_open_docs", safe((data: { senderId: string; docsId: string }) => userOpenDocs(data, socket)));
    socket.on(
        "update_docs",
        safe((data: { senderId: string; docsId: string; update: number[] }) => updateDocs(data, socket))
    );
    socket.on(
        "send_edit_request",
        safe((data: { senderId: string; docsId: string }) => sendEditRequest(data, socket, io, users))
    );
    socket.on(
        "show_all_edit_request",
        safe((data: { senderId: string; docsId: string }) => showAllEditRequest(data, socket))
    );
    socket.on(
        "update_docs_permission",
        safe((data: { senderId: string; docsId: string; receiverId: string }) =>
            updatePermission(data, socket, io, users, activeDocs)
        )
    );

    socket.on("delete_docs",async(data)=>{
        try{
            await deleteDocs(data,socket,io,users);
        }catch(err){
            const error=err instanceof Error?err.message:"Unknown Error";
            socket.emit("docs_error",(error));
        }
    });


    socket.on("update_docs_name",async(data)=>{
        try{
            await updateDoc(data,socket,io,users);            
        }catch(err){
            const error=err instanceof Error?err.message:"Unknown Error";
            socket.emit("docs_error",(error));
        }
    });

    socket.on("download_docs_file", safe((data: { senderId: string; docsId: string }) => downloadDocsFile(data, socket)));
    socket.on("disconnecting", () => {
        for (const room of socket.rooms) {
            if (room.startsWith("doc:")) {
                const size = (socket.nsp.adapter.rooms.get(room)?.size || 1) - 1; // khud ko hatao
                socket.to(room).emit("docs_online", { docsId: room.slice(4), size });
            }
        }
    });
};