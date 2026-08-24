import { useEffect, useState } from "react";
import { socket } from "../../utils/socket";
import "./msgInfo.css";

interface MsgUser {
    _id: string;
    name: string;
    avatar?: string;
    deliveredAt?: string;
    seenAt?: string;
}

interface MsgInfoData {
    _id?: string;
    message?: string;
    messageType?: string;
    deliveredTo: MsgUser[];
    seenBy: MsgUser[];
    deliveredRemaining: number;
    seenRemaining: number;
}

interface Props {
    open: boolean;
    onClose: () => void;
    messageId?: string;
}

export function MsgInfo({ open, onClose, messageId }: Props) {

    const [data, setData] = useState<MsgInfoData | null>(null);

    useEffect(() => {
        if (!open || !messageId) return;

        const handleMsgInfo = (data: MsgInfoData) => {
            console.log("Message info received:", data);
            setData(data);
        };

        socket.on("msg_info_data", handleMsgInfo);

        return () => {
            socket.off("msg_info_data", handleMsgInfo);
        };
    }, [open, messageId]);

    if (!open) return null;

    const formatTime = (date?: string) => {
        if (!date) return "";

        return new Date(date).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
        });
    };

    return (
        <div className="msg-info-panel">

            <div className="msg-info-header">
                <button className="msg-info-close" onClick={onClose}>
                    ←
                </button>

                <span>Message info</span>
            </div>

            <div className="msg-info-body">

                {/* MESSAGE */}
                <div className="msg-info-message">
                    <div className="msg-info-message-bubble">
                        {data?.message || "Message"}
                    </div>
                </div>

                {/* READ BY */}
                <section className="msg-info-section">

                    <div className="msg-info-title">
                        <span className="double-tick blue">✓✓</span>
                        <span>Read by</span>
                    </div>

                    {data?.seenBy?.length ? (
                        data.seenBy.map((user) => (
                            <div className="msg-info-user" key={user._id}>

                                <img
                                    src={user.avatar || "/default.webp"}
                                    className="msg-info-avatar"
                                    alt=""
                                />

                                <div className="msg-info-user-detail">
                                    <div className="msg-info-user-name">
                                        {user.name}
                                    </div>

                                    {user.seenAt && (
                                        <div className="msg-info-user-time">
                                            Today at {formatTime(user.seenAt)}
                                        </div>
                                    )}
                                </div>

                            </div>
                        ))
                    ) : (
                        <div className="msg-info-empty">
                            No one has read this message yet
                        </div>
                    )}

                    {data && data.seenRemaining > 0 && (
                        <div className="msg-info-remaining">
                            {data.seenRemaining} remaining
                        </div>
                    )}

                </section>

                {/* DELIVERED TO */}
                <section className="msg-info-section">

                    <div className="msg-info-title">
                        <span className="double-tick">✓✓</span>
                        <span>Delivered to</span>
                    </div>

                    {data?.deliveredTo?.length ? (
                        data.deliveredTo.map((user) => (
                            <div className="msg-info-user" key={user._id}>

                                <img
                                    src={user.avatar || "/default.webp"}
                                    className="msg-info-avatar"
                                    alt=""
                                />

                                <div className="msg-info-user-detail">
                                    <div className="msg-info-user-name">
                                        {user.name}
                                    </div>

                                    {user.deliveredAt && (
                                        <div className="msg-info-user-time">
                                            Today at {formatTime(user.deliveredAt)}
                                        </div>
                                    )}
                                </div>

                            </div>
                        ))
                    ) : (
                        <div className="msg-info-empty">
                            No delivery information
                        </div>
                    )}

                    {data && data.deliveredRemaining > 0 && (
                        <div className="msg-info-remaining">
                            {data.deliveredRemaining} remaining
                        </div>
                    )}

                </section>

            </div>
        </div>
    );
}