import { useCallback, useEffect, useState } from "react";
import { socket } from "../utils/socket";
import { showApiError } from "../utils/showApiError";

export interface DocsMsgReaction {
    _id?: string;
    userId: string;
    emoji: string;
}

export interface DocsMsgReply {
    parentId: string;
    senderId: string;
    message: string;
}

export interface DocsChatMessage {
    _id: string;
    docsId: string;
    senderId: string | { _id: string; name: string; avatar?: string };
    message: string;
    viewedBy: string[];
    toggleLike: string[];
    reaction: DocsMsgReaction[];
    reply?: DocsMsgReply[];
    isEdited?: boolean;
    createdAt: string;
}

export interface ViewedByUser {
    _id: string;
    name?: string;
    avatar?: string;
}

export function useDocsMessage(docsId: string, senderId: string) {
    const [messages, setMessages] = useState<DocsChatMessage[]>([]);
    const [viewedByList, setViewedByList] = useState<ViewedByUser[]>([]);

    useEffect(() => {
        if (!docsId || !senderId) return;

        const onAll = (d: { docsId: string; msg: DocsChatMessage[] }) => {
            if (d.docsId === docsId) setMessages(d.msg);
        };

        const onNew = (d: { data: unknown; create: DocsChatMessage }) => {
            if (d.create.docsId === docsId) setMessages((prev) => [...prev, d.create]);
        };

        const onDeleted = (d: { docsId: string; msgId: string; msg: string }) => {
            if (d.docsId !== docsId) return;
            setMessages((prev) => prev.map((m) => (m._id === d.msgId ? { ...m, message: d.msg } : m)));
        };

        const onUpdated = (d: { docsId: string; msgId: string; message: string }) => {
            if (d.docsId !== docsId) return;
            setMessages((prev) =>
                prev.map((m) => (m._id === d.msgId ? { ...m, message: d.message, isEdited: true } : m))
            );
        };

        const onLike = (d: { data: { msgId: string; docsId: string; senderId: string } }) => {
            if (d.data.docsId !== docsId) return;
            setMessages((prev) =>
                prev.map((m) => {
                    if (m._id !== d.data.msgId) return m;
                    const has = m.toggleLike.includes(d.data.senderId);
                    const toggleLike = has
                        ? m.toggleLike.filter((id) => id !== d.data.senderId)
                        : [...m.toggleLike, d.data.senderId];
                    return { ...m, toggleLike };
                })
            );
        };

        const onReaction = (d: { data: { docsId: string; msgId: string }; msg: DocsChatMessage }) => {
            if (d.data.docsId !== docsId) return;
            setMessages((prev) => prev.map((m) => (m._id === d.data.msgId ? d.msg : m)));
        };

        const onViewedBy = (msg: { viewedBy: ViewedByUser[] }) => {
            setViewedByList(msg.viewedBy);
        };

        const onError = (msg: string) => showApiError(msg);

        socket.on("all_docs_message", onAll);
        socket.on("docs_message", onNew);
        socket.on("docs_message_deleted", onDeleted);
        socket.on("docs_message_updated", onUpdated);
        socket.on("toggle_docs_msg", onLike);
        socket.on("docs_msg_reaction", onReaction);
        socket.on("docs_parent_reply", onNew);
        socket.on("docs_viewedBy_data", onViewedBy);
        socket.on("docs_message_error", onError);

        socket.emit("docs_msg_get_all", { docsId });

        return () => {
            socket.off("all_docs_message", onAll);
            socket.off("docs_message", onNew);
            socket.off("docs_message_deleted", onDeleted);
            socket.off("docs_message_updated", onUpdated);
            socket.off("toggle_docs_msg", onLike);
            socket.off("docs_msg_reaction", onReaction);
            socket.off("docs_parent_reply", onNew);
            socket.off("docs_viewedBy_data", onViewedBy);
            socket.off("docs_message_error", onError);
        };
    }, [docsId, senderId]);

    const sendMessage = useCallback(
        (message: string) => socket.emit("docs_msg_send", { docsId, senderId, message }),
        [docsId, senderId]
    );

    const sendReply = useCallback(
        (message: string, parent: DocsChatMessage) =>
            socket.emit("docs_msg_reply", {
                docsId, senderId, message,
                parentData: { parentId: parent._id },
            }),
        [docsId, senderId]
    );

    const deleteMessage = useCallback(
        (msgId: string) => socket.emit("docs_msg_delete", { docsId, msgId, senderId }),
        [docsId, senderId]
    );

    const editMessage = useCallback(
        (msgId: string, message: string) => socket.emit("docs_msg_update", { docsId, msgId, senderId, message }),
        [docsId, senderId]
    );

    const toggleLike = useCallback(
        (msgId: string) => socket.emit("docs_msg_toggle_like", { docsId, msgId, senderId }),
        [docsId, senderId]
    );

    const toggleReaction = useCallback(
        (msgId: string, emoji: string) => socket.emit("docs_msg_react", { docsId, msgId, senderId, emoji }),
        [docsId, senderId]
    );

    const markViewed = useCallback(
        () => socket.emit("docs_msg_mark_viewed", { docsId, senderId }),
        [docsId, senderId]
    );

    const fetchViewedBy = useCallback(
        (msgId: string) => socket.emit("docs_msg_get_viewed_by", { docsId, msgId, senderId }),
        [docsId, senderId]
    );

    return {
        messages, viewedByList,
        sendMessage, sendReply, deleteMessage, editMessage,
        toggleLike, toggleReaction, markViewed, fetchViewedBy,
    };
}