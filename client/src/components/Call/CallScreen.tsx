import { useCallHook } from "../../hooks/use.call.hook";
import "./CallScreen.css";

interface CallScreenProps {
    senderId: string;
}

export function CallScreen({ senderId }: CallScreenProps) {
    const {
        localVideoRef,
        remoteVideoRef,
        callStatus,
        incomingCall,
        acceptCall,
        rejectCall,
        endCall,
    } = useCallHook(senderId);

    if (callStatus === "idle") return null;

    return (
        <div className="callOverlay">

            {callStatus === "ringing" && incomingCall && (
                <div className="incomingCallBox">
                    <p>Incoming {incomingCall.callType} call...</p>
                    <div className="incomingCallActions">
                        <button className="acceptBtn" onClick={acceptCall}>Accept</button>
                        <button className="rejectBtn" onClick={rejectCall}>Reject</button>
                    </div>
                </div>
            )}

            {callStatus === "calling" && (
                <div className="callingBox">
                    <p>Calling...</p>
                    <video ref={localVideoRef} autoPlay muted playsInline className="localVideoSmall" />
                    <button className="endCallBtn" onClick={endCall}>Cancel</button>
                </div>
            )}

            {callStatus === "ongoing" && (
                <div className="ongoingCallBox">
                    <video ref={remoteVideoRef} autoPlay playsInline className="remoteVideo" />
                    <video ref={localVideoRef} autoPlay muted playsInline className="localVideoSmall" />
                    <button className="endCallBtn" onClick={endCall}>End Call</button>
                </div>
            )}

        </div>
    );
}