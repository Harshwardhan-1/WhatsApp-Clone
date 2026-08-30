import { useState, useRef } from "react";

export function useCallHook() {
    const [localStream,setLocalStream]=useState<MediaStream | null>(null);
    const localVideoRef=useRef<HTMLVideoElement | null>(null);

    const startLocalMedia=async(callType:"video"|"audio")=>{
        try{
            const constraints=callType==="video"?{ video:true,audio:true}:{video:false,audio:true };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setLocalStream(stream);
            if (localVideoRef.current) {
                localVideoRef.current.srcObject=stream;
            }
        }catch(err){
            console.log("media access error:",err);
        }
    };
    return {
        localStream,
        localVideoRef,
        startLocalMedia,
    };
}