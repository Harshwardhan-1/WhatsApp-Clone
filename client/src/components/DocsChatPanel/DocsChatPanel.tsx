import { useEffect, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import { MessageCircle, X, Send, Smile, MoreVertical, Copy, Pencil, Trash2, Eye, Heart, CornerUpLeft } from "lucide-react";
import { useDocsMessage } from "../../hooks/use.docs.message.hook";
import type{ DocsChatMessage } from "../../hooks/use.docs.message.hook";
import "./DocsChatPanel.css";

interface Props {
    docsId: string;
    senderId: string;
    getMemberName: (id: string) => string;
}

export function DocsChatPanel({ docsId, senderId, getMemberName }: Props) {
    const {
        messages, viewedByList,
        sendMessage, sendReply, deleteMessage, editMessage,
        toggleLike, toggleReaction, markViewed, fetchViewedBy,
    } = useDocsMessage(docsId, senderId);

    const [isOpen, setIsOpen] = useState(false);
    const [unread, setUnread] = useState(0);
    const [text, setText] = useState("");
    const [replyTarget, setReplyTarget] = useState<DocsChatMessage | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState("");
    const [reactionFor, setReactionFor] = useState<string | null>(null);
    const [reactionDetailFor, setReactionDetailFor] = useState<string | null>(null);
    const [likersFor, setLikersFor] = useState<string | null>(null);
    const [viewedByFor, setViewedByFor] = useState<string | null>(null);

    const bottomRef = useRef<HTMLDivElement | null>(null);
    const reactionRef = useRef<HTMLDivElement | null>(null);
    const reactionDetailRef = useRef<HTMLDivElement | null>(null);
    const likersRef = useRef<HTMLDivElement | null>(null);
    const viewedByRef = useRef<HTMLDivElement | null>(null);
    const prevCount = useRef(0);

    useEffect(() => {
        if (!isOpen && messages.length > prevCount.current) {
            setUnread((u) => u + (messages.length - prevCount.current));
        }
        prevCount.current = messages.length;
    }, [messages.length, isOpen]);

    useEffect(() => {
        if (isOpen) {
            markViewed();
            setUnread(0);
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [isOpen, messages.length]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (reactionRef.current && !reactionRef.current.contains(e.target as Node)) setReactionFor(null);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (reactionDetailRef.current && !reactionDetailRef.current.contains(e.target as Node)) setReactionDetailFor(null);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (likersRef.current && !likersRef.current.contains(e.target as Node)) setLikersFor(null);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (viewedByRef.current && !viewedByRef.current.contains(e.target as Node)) setViewedByFor(null);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const groupReactions = (reactions: { userId: string; emoji: string }[] = []) =>
        reactions.reduce((acc, r) => {
            if (!acc[r.emoji]) acc[r.emoji] = [];
            acc[r.emoji].push(r.userId);
            return acc;
        }, {} as Record<string, string[]>);

    const handleSend = () => {
        if (!text.trim()) return;
        if (replyTarget) sendReply(text.trim(), replyTarget);
        else sendMessage(text.trim());
        setText("");
        setReplyTarget(null);
    };

    const handleOpenViewedBy = (msgId: string) => {
        fetchViewedBy(msgId);
        setViewedByFor(msgId);
    };

    const nameOf = (id: string) => (id === senderId ? "You" : getMemberName(id));

    return (
        <>
            <button className="docsChatToggleBtn" onClick={() => setIsOpen((v) => !v)}>
                <MessageCircle size={20} />
                {unread > 0 && <span className="docsChatUnreadBadge">{unread > 99 ? "99+" : unread}</span>}
            </button>

            {isOpen && (
                <div className="docsChatPanel">
                    <div className="docsChatHeader">
                        <span>Document Chat</span>
                        <button onClick={() => setIsOpen(false)}><X size={18} /></button>
                    </div>

                    <div className="docsChatBody">
                        {messages.map((msg) => {
                            const msgSenderId = typeof msg.senderId === "object" ? msg.senderId._id : msg.senderId;
                            const isSender = msgSenderId?.toString() === senderId?.toString();
                            const isDeleted = msg.message === "This Message Is Deleted";
                            const parent = msg.reply?.[0];
                            const likedByMe = msg.toggleLike?.includes(senderId);

                            return (
                                <div key={msg._id} className={`docsChatMsgRow ${isSender ? "sender" : "receiver"}`}>
                                    {!isDeleted && (
                                        <div className="docsChatLikeBlock">
                                            <button
                                                className={`docsChatLikeBtn ${likedByMe ? "liked" : ""}`}
                                                onClick={() => toggleLike(msg._id)}
                                            >
                                                <Heart size={14} fill={likedByMe ? "#ff3040" : "none"} />
                                            </button>
                                            {msg.toggleLike?.length > 0 && (
                                                <span
                                                    className="docsChatLikeCount"
                                                    onClick={() => !isSender && setLikersFor(msg._id)}
                                                >
                                                    {msg.toggleLike.length}
                                                </span>
                                            )}
                                            {!isSender && likersFor === msg._id && (
                                                <div className="docsChatLikersPopup" ref={likersRef}>
                                                    {msg.toggleLike.map((uid) => (
                                                        <div key={uid}>{nameOf(uid)}</div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="docsChatBubble">
                                        {!isSender && (
                                            <span className="docsChatSenderName">
                                                {typeof msg.senderId === "object" ? msg.senderId.name : getMemberName(msgSenderId)}
                                            </span>
                                        )}

                                        {parent && !isDeleted && (
                                            <div className="docsChatQuoted">
                                                <span className="docsChatQuotedName">{nameOf(parent.senderId)}</span>
                                                <span className="docsChatQuotedText">{parent.message}</span>
                                            </div>
                                        )}

                                        <p className={`docsChatText ${isDeleted ? "deleted" : ""}`}>{msg.message}</p>

                                        {msg.isEdited && !isDeleted && <span className="docsChatEdited">edited</span>}

                                        {!isDeleted && (
                                            <div className="docsChatMsgActions">
                                                <button onClick={() => setReplyTarget(msg)} title="Reply">
                                                    <CornerUpLeft size={13} />
                                                </button>
                                                <button onClick={() => setReactionFor(reactionFor === msg._id ? null : msg._id)} title="React">
                                                    <Smile size={13} />
                                                </button>
                                                {isSender && (
                                                    <button onClick={() => handleOpenViewedBy(msg._id)} title="Seen by">
                                                        <Eye size={13} />
                                                    </button>
                                                )}
                                                {isSender && (
                                                    <div className="docsChatMenu">
                                                        <button><MoreVertical size={13} /></button>
                                                        <div className="docsChatMenuDropdown">
                                                            <button onClick={() => navigator.clipboard.writeText(msg.message)}>
                                                                <Copy size={12} /> Copy
                                                            </button>
                                                            <button onClick={() => { setEditingId(msg._id); setEditText(msg.message); }}>
                                                                <Pencil size={12} /> Edit
                                                            </button>
                                                            <button onClick={() => deleteMessage(msg._id)}>
                                                                <Trash2 size={12} /> Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {reactionFor === msg._id && (
                                            <div className="docsChatEmojiPopup" ref={reactionRef}>
                                                <EmojiPicker
                                                    onEmojiClick={(e) => { toggleReaction(msg._id, e.emoji); setReactionFor(null); }}
                                                />
                                            </div>
                                        )}

                                        {msg.reaction?.length > 0 && (
                                            <div className="docsChatReactionBadge" onClick={() => setReactionDetailFor(msg._id)}>
                                                {Object.keys(groupReactions(msg.reaction)).slice(0, 3).map((e) => <span key={e}>{e}</span>)}
                                                {msg.reaction.length > 1 && <span className="docsChatReactionCount">{msg.reaction.length}</span>}
                                            </div>
                                        )}

                                        {reactionDetailFor === msg._id && (
                                            <div className="docsChatReactionDetail" ref={reactionDetailRef}>
                                                {msg.reaction.map((r) => (
                                                    <div
                                                        key={r._id || r.userId + r.emoji}
                                                        className="docsChatReactionRow"
                                                        onClick={() => { if (r.userId === senderId) toggleReaction(msg._id, r.emoji); }}
                                                    >
                                                        <span>{nameOf(r.userId)}</span>
                                                        <span>{r.emoji}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {viewedByFor === msg._id && isSender && (
                                            <div className="docsChatViewedByPopup" ref={viewedByRef}>
                                                <span className="docsChatViewedByTitle">Seen by</span>
                                                {viewedByList.filter((u) => u._id !== senderId).length === 0 && <div>No one yet</div>}
                                                {viewedByList.filter((u) => u._id !== senderId).map((u) => (
                                                    <div key={u._id}>{u.name || "Unknown"}</div>
                                                ))}
                                            </div>
                                        )}

                                        {editingId === msg._id && (
                                            <div className="docsChatEditBox">
                                                <input value={editText} onChange={(e) => setEditText(e.target.value)} autoFocus />
                                                <button onClick={() => { editMessage(msg._id, editText); setEditingId(null); }}>Save</button>
                                                <button onClick={() => setEditingId(null)}>Cancel</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={bottomRef} />
                    </div>

                    {replyTarget && (
                        <div className="docsChatReplyPreview">
                            <div>
                                <span className="docsChatQuotedName">
                                    {nameOf(typeof replyTarget.senderId === "object" ? replyTarget.senderId._id : replyTarget.senderId)}
                                </span>
                                <span className="docsChatQuotedText">{replyTarget.message}</span>
                            </div>
                            <button onClick={() => setReplyTarget(null)}><X size={14} /></button>
                        </div>
                    )}

                    <div className="docsChatComposer">
                        <input
                            type="text"
                            placeholder="Message..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        />
                        <button onClick={handleSend}><Send size={16} /></button>
                    </div>
                </div>
            )}
        </>
    );
}