import { useEffect, useState } from "react";
import { socket } from "../../utils/socket";
import "./GroupSettings.css";

interface prop {
    onBack: () => void;
    _id: string;
    senderId: string;
}

interface GroupSettingsData {
    canChangeGroupName: boolean;
    canChangeGroupImage: boolean;
    canAddGroupMembers: boolean;
    canRemoveGroupMembers: boolean;
    changeDisappearingMessageSetting: boolean;
    onlyAdminSendMessage: boolean;
}

function ToggleSwitch({
    checked,
    onChange,
    disabled,
}: {
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            className={`toggleSwitch ${checked ? "on" : "off"}`}
            onClick={() => !disabled && onChange()}
            disabled={disabled}
        >
            <span className="toggleKnob" />
        </button>
    );
}

export function GroupSettings({ onBack, _id, senderId }: prop) {
    const [settings, setSettings] = useState<GroupSettingsData | null>(null);

    useEffect(() => {
        socket.emit("get_group_settings", { _id, senderId });

        socket.on("group_settings_data", (data: GroupSettingsData) => {
            setSettings(data);
        });

        socket.on("group_settings_updated", (data: GroupSettingsData) => {
            setSettings(data);
        });

        return () => {
            socket.off("group_settings_data");
            socket.off("group_settings_updated");
        };
    }, [_id, senderId]);

    const handleToggle = (key: keyof GroupSettingsData) => {
        if (!settings) return;
        const updated = { ...settings, [key]: !settings[key] };
        setSettings(updated);

        socket.emit("update_group_settings", {
            _id,
            senderId,
            canChangeGroupName: updated.canChangeGroupName,
            canChangeGroupImage: updated.canChangeGroupImage,
            canAddGroupMembers: updated.canAddGroupMembers,
            canRemoveGroupMembers: updated.canRemoveGroupMembers,
            changeDisappearingMessageSetting: updated.changeDisappearingMessageSetting,
            onlyAdminSendMessage: updated.onlyAdminSendMessage,
        });
    };

    const settingsRows: { key: keyof GroupSettingsData; title: string; description: string }[] = [
        { key: "canChangeGroupName", title: "Edit group name", description: "Allow all members to change the group name, not just admins" },
        { key: "canChangeGroupImage", title: "Edit group icon", description: "Allow all members to change the group icon" },
        { key: "canAddGroupMembers", title: "Add members", description: "Allow all members to add new participants" },
        { key: "canRemoveGroupMembers", title: "Remove members", description: "Allow admins to remove participants" },
        { key: "changeDisappearingMessageSetting", title: "Disappearing messages", description: "Allow all members to change the disappearing message duration" },
        { key: "onlyAdminSendMessage", title: "Send messages", description: "Only admins will be able to send messages when this is on" },
    ];

   

    return (
        <div className="groupSettingsPage">
            <div className="groupSettingsTopBar">
                <button className="backArrow" onClick={onBack}>←</button>
                <h2>Group Settings</h2>
            </div>

            <div className="groupSettingsList">
                {settingsRows.map((row) => (
                    <div key={row.key} className="groupSettingsRow">
                        <div className="groupSettingsInfo">
                            <span className="groupSettingsTitle">{row.title}</span>
                            <span className="groupSettingsDesc">{row.description}</span>
                        </div>
                        <ToggleSwitch
                            checked={settings?.[row.key] ?? false}
                            onChange={() => handleToggle(row.key)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}