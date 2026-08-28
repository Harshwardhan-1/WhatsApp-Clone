import { useState, useEffect } from "react";
import { socket } from "../../utils/socket";
import { env } from "../../configs/env.config";
import "./ForwardModel.css";

interface ForwardModalProps {
    onClose: () => void;
    senderId: string;
    users: any[];
    groups: any[];
    selectedMessageIds: string[];
    onForwarded?: () => void;
}

interface Target {
    type: "user" | "group";
    id: string;
}

function resolveFileUrl(fileUrl?: string) {
    if (!fileUrl) return "";
    if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) return fileUrl;
    return `${env.backendUrl}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
}

export function ForwardModal({
    onClose,
    senderId,
    users,
    groups,
    selectedMessageIds,
    onForwarded,
}: ForwardModalProps) {
    const [search, setSearch] = useState("");
    const [selectedTargets, setSelectedTargets] = useState<Target[]>([]);

    const [memberGroupIds, setMemberGroupIds] = useState<Set<string> | null>(null);

    useEffect(() => {
    if (!senderId) return;

    const handleCurrentGroups = (data: any[]) => {
        console.log("current_groups_members received:", data);
        const ids = new Set((data ?? []).map((g: any) => g._id?.toString()));
        setMemberGroupIds(ids);
    };
    socket.on("current_groups_members", handleCurrentGroups);
    socket.emit("current_groups", { senderId });
    return () => {
        socket.off("current_groups_members", handleCurrentGroups);
    };
}, [senderId]);
  const isGroupDisabled = (group: any) => {
    const isMember = group.peoplesId?.some((member: any) => {
        const memberId = typeof member === "object" ? member?._id : member;
        return memberId?.toString() === senderId?.toString();
    });

    if (!isMember) return true;

    if (!group.onlyAdminSendMessage) return false;

    const isAdmin = group.admin?.some((a: any) => {
        const adminId = typeof a === "object" ? a?._id : a;
        return adminId?.toString() === senderId?.toString();
    });

    return !isAdmin;
};

const getDisabledReason = (group: any): string | null => {
    const isMember = group.peoplesId?.some((member: any) => {
        const memberId = typeof member === "object" ? member?._id : member;
        return memberId?.toString() === senderId?.toString();
    });
    if (!isMember) return "You're no longer in this group";
    if (group.onlyAdminSendMessage) {
        const isAdmin = group.admin?.some((a: any) => {
            const adminId = typeof a === "object" ? a?._id : a;
            return adminId?.toString() === senderId?.toString();
        });
        if (!isAdmin) return "Only admins can send";
    }
    return null;
};
    const isSelected = (type: "user" | "group", id: string) =>
        selectedTargets.some((t) => t.type === type && t.id === id);

    const toggleTarget = (type: "user" | "group", id: string, disabled?: boolean) => {
        if (disabled) return;
        setSelectedTargets((prev) =>
            isSelected(type, id)
                ? prev.filter((t) => !(t.type === type && t.id === id))
                : [...prev, { type, id }]
        );
    };

    const filteredGroups = groups?.filter((g: any) =>
        g.groupName?.toLowerCase().includes(search.toLowerCase())
    ) ?? [];

    const filteredUsers = users?.filter((u: any) =>
        u.name?.toLowerCase().includes(search.toLowerCase())
    ) ?? [];



    const handleSend = () => {
        if (selectedTargets.length === 0 || selectedMessageIds.length === 0) return;
        socket.emit("forward_messages", {
            messageIds: selectedMessageIds,
            senderId,
            targets: selectedTargets,
        });
        onForwarded?.();
        onClose();
    };

    return (
        <div className="forwardOverlay" onClick={onClose}>
            <div className="forwardModal" onClick={(e) => e.stopPropagation()}>
                <div className="forwardHeader">
                    <button className="closeBtn" onClick={onClose}>✕</button>
                    <h3>Forward {selectedMessageIds.length} message{selectedMessageIds.length > 1 ? "s" : ""}</h3>
                </div>

                <input
                    className="forwardSearch"
                    type="text"
                    placeholder="Search name or group"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <div className="forwardList">
                    {filteredGroups.length > 0 && (
                        <div className="forwardSection">
                            <span className="forwardSectionLabel">Groups</span>
                            {filteredGroups.map((g: any) => {
                                const disabled = isGroupDisabled(g);
                                const disabledReason = getDisabledReason(g);
                                const checked = isSelected("group", g._id);
                                return (
                                    <div
                                        key={g._id}
                                        className={`forwardRow ${disabled ? "forwardRowDisabled" : ""}`}
                                        onClick={() => toggleTarget("group", g._id, disabled)}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            disabled={disabled}
                                            onChange={() => toggleTarget("group", g._id, disabled)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <div className="forwardAvatar">
                                            {g.groupImage ? (
                                                <img src={resolveFileUrl(g.groupImage)} alt={g.groupName} />
                                            ) : (
                                                <span>{g.groupName?.charAt(0)?.toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div className="forwardInfo">
                                            <span className="forwardName">{g.groupName}</span>
                                            {disabledReason && (
                                                <span className="forwardDisabledTag">{disabledReason}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {filteredUsers.length > 0 && (
                        <div className="forwardSection">
                            <span className="forwardSectionLabel">Contacts</span>
                            {filteredUsers.map((u: any) => {
                                const checked = isSelected("user", u._id);
                                return (
                                    <div
                                        key={u._id}
                                        className="forwardRow"
                                        onClick={() => toggleTarget("user", u._id)}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => toggleTarget("user", u._id)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <div className="forwardAvatar">
                                            {u.avatar ? (
                                                <img src={resolveFileUrl(u.avatar)} alt={u.name} />
                                            ) : (
                                                <span>{u.name?.charAt(0)?.toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div className="forwardInfo">
                                            <span className="forwardName">{u.name}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {filteredGroups.length === 0 && filteredUsers.length === 0 && (
                        <div className="forwardEmpty">No results found</div>
                    )}
                </div>

                <div className="forwardFooter">
                    <span className="forwardSelectedCount">
                        {selectedTargets.length > 0 ? `${selectedTargets.length} selected` : "Select a chat"}
                    </span>
                    <button
                        className="forwardSendBtn"
                        disabled={selectedTargets.length === 0}
                        onClick={handleSend}
                    >
                        ➤
                    </button>
                </div>
            </div>
        </div>
    );
}