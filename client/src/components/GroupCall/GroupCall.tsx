import {
    LiveKitRoom,
    RoomAudioRenderer,
    GridLayout,
    ParticipantTile,
    ControlBar,
    TrackLoop,
    ParticipantAudioTile,
    useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import "./GroupCall.css";
import { CallChatPanel } from "../CallChatPanel/CallChatPanel";

type GroupCallProps = {
    token: string;
    callType: "voice" | "video";
    onClose: () => void;
    callId: string;
    groupId: string;
    senderId: string;
    getMemberName: (id: string) => string;
};

function VideoCallStage() {
    const tracks = useTracks(
        [{ source: Track.Source.Camera, withPlaceholder: true }],
        { onlySubscribed: false }
    );

    return (
        <>
            <GridLayout tracks={tracks}>
                <ParticipantTile />
            </GridLayout>

            <ControlBar
                controls={{
                    microphone: true,
                    camera: true,
                    screenShare: false,
                    chat: false,
                    settings: false,
                    leave: true,
                }}
            />
        </>
    );
}

function VoiceCallStage() {
    const audioTracks = useTracks([Track.Source.Microphone]);

    return (
        <div className="lk-audio-conference">
            <div className="lk-audio-conference-stage">
                <TrackLoop tracks={audioTracks}>
                    <ParticipantAudioTile />
                </TrackLoop>
            </div>

            <ControlBar
                controls={{
                    microphone: true,
                    camera: false,
                    screenShare: false,
                    chat: false,
                    settings: false,
                    leave: true,
                }}
            />
        </div>
    );
}

export function GroupCall({ token, callType, onClose, callId, groupId, senderId, getMemberName }: GroupCallProps) {

    const liveKitUrl = import.meta.env.VITE_LIVEKIT_URL;

    if (!liveKitUrl) {
        return (
            <div className="group-call-overlay">
                <div className="group-call-error">
                    <h3>LiveKit URL not found</h3>
                    <p>Please configure VITE_LIVEKIT_URL</p>
                    <button onClick={onClose}>Close</button>
                </div>
            </div>
        );
    }

    return (
        <div className="group-call-overlay">

            <div className="group-call-container">

                <div className="group-call-header">
                    <span>
                        {callType === "video" ? "Group Video Call" : "Group Voice Call"}
                    </span>

                    <button className="group-call-close" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <LiveKitRoom
                    token={token}
                    serverUrl={liveKitUrl}
                    connect={true}
                    audio={true}
                    video={callType === "video"}
                    onDisconnected={onClose}
                    onError={(error) => {
                        console.error("LiveKit error:", error);
                    }}
                    className="group-livekit-room"
                    data-lk-theme="default"
                >
                    {callType === "video" ? <VideoCallStage /> : <VoiceCallStage />}

                    <RoomAudioRenderer />

                </LiveKitRoom>

                <CallChatPanel
                    callId={callId}
                    groupId={groupId}
                    senderId={senderId}
                    getMemberName={getMemberName}
                />

            </div>

        </div>
    );
}