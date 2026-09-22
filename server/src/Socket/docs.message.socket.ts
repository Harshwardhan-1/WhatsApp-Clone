import { Socket, Server } from 'socket.io';
import {
    createDocsMsg,
    deleteMsg,
    updateMsg,
    toggleLike,
    docsReaction,
    parentReply,
    allMsg,
    viewed,
    getAllViewed,
} from '../controllers/docs.message.controller';
import type { DocsMessage, DeleteDocsMsg, ParentReply } from "../types/docs.message.types";
export const docsMessageSocket=(socket:Socket,io:Server,
    users:{[key:string]:string},activeDocs:Record<string,string>
) => {
    const safe=<T>(fn: (data: T) => Promise<unknown> | unknown) =>
        async(data:T)=>{
            try {
                await fn(data);
            } catch (err) {
                socket.emit("docs_message_error", err instanceof Error ? err.message : "Unknown Error");
            }
        };

    socket.on("docs_msg_send", safe((data: DocsMessage) => createDocsMsg(data, socket, io, users, activeDocs)));
    socket.on("docs_msg_delete", safe((data: DeleteDocsMsg) => deleteMsg(data, socket, io, users, activeDocs)));
    socket.on(
        "docs_msg_update",
        safe((data: { docsId: string; msgId: string; senderId: string; message: string }) =>
            updateMsg(data, socket, io, users, activeDocs)
        )
    );

    socket.on(
        "docs_msg_toggle_like",
        safe((data: { docsId: string; senderId: string; msgId: string }) =>
            toggleLike(data, socket, io, users, activeDocs)
        )
    );

    socket.on(
        "docs_msg_react",
        safe((data: { docsId: string; msgId: string; senderId: string; emoji: string }) =>
            docsReaction(data, socket, io, users, activeDocs)
        )
    );

    socket.on("docs_msg_reply", safe((data: ParentReply) => parentReply(data, socket, io, users, activeDocs)));

    socket.on("docs_msg_get_all", safe((data: { docsId: string }) => allMsg(data, socket)));

    socket.on("docs_msg_mark_viewed", safe((data: { senderId: string; docsId: string }) => viewed(data)));

    socket.on(
        "docs_msg_get_viewed_by",
        safe((data: { docsId: string; msgId: string; senderId: string }) => getAllViewed(data, socket))
    );
};