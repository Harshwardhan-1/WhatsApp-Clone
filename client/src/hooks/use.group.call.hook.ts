import { useEffect, useRef, useState, useCallback } from "react";
import { socket } from "../utils/socket";

type CallType = "voice" | "video";

type IncomingCall = {
    groupId:string;
    senderId:string;
    receiverId:string;
    msgId:string;
    messageType:CallType;
};

type ActiveCall = {
    groupId:string;
    msgId:string;
    messageType:CallType;
    liveKitData:string;
};

export function groupCall(senderId:string){

    const [incomingCall,setIncomingCall]=useState<IncomingCall | null>(null);
    const [activeCall,setActiveCall]=useState<ActiveCall | null>(null);
    const [calling,setCalling]=useState<boolean>(false);
    const [callError,setCallError]=useState<string>("");

    const incomingTimerRef=useRef<ReturnType<typeof setTimeout> | null>(null);

    const hasLeftRef = useRef(false);
    const expectedMsgIdRef = useRef<string | "any-new" | null>(null);
    const activeCallRef = useRef<ActiveCall | null>(null);

    useEffect(() => {
        activeCallRef.current = activeCall;
    }, [activeCall]);

    const clearIncomingTimer=()=>{
        if(incomingTimerRef.current){
            clearTimeout(incomingTimerRef.current);
            incomingTimerRef.current=null;
        }
    };

    const startGroupCall=(data:{
        groupId:string;
        receiverId:string[];
        messageType:CallType;
    })=>{
        setCallError("");
        setCalling(true);
        hasLeftRef.current = false;
        expectedMsgIdRef.current = "any-new"; 

        socket.emit("create_group_call",{
            groupId:data.groupId,
            senderId,
            receiverId:data.receiverId,
            messageType:data.messageType
        });
    };

    const acceptGroupCall=()=>{
        if(!incomingCall){
            return;
        }

        clearIncomingTimer();
        hasLeftRef.current = false;
        expectedMsgIdRef.current = incomingCall.msgId; // NEW

        socket.emit("group_call_accepted",{
            groupId:incomingCall.groupId,
            senderId,
            msgId:incomingCall.msgId,
            messageType:incomingCall.messageType
        });

        setCalling(true);
        setIncomingCall(null);
    };

    const rejectGroupCall=()=>{
        if(!incomingCall){
            return;
        }

        clearIncomingTimer();

        socket.emit("group_call_rejected_by_user",{
            groupId:incomingCall.groupId,
            senderId:incomingCall.senderId,
            receiverId:senderId,
            msgId:incomingCall.msgId
        });

        setIncomingCall(null);
    };

 
    const joinOngoingCall=(groupId:string, msgId:string, messageType:CallType)=>{
        setCallError("");
        setCalling(true);
        hasLeftRef.current = false;
        expectedMsgIdRef.current = msgId; 

        socket.emit("group_call_accepted",{
            groupId,
            senderId,
            msgId,
            messageType,
        });
    };

    const leaveGroupCall=useCallback(()=>{
        if(hasLeftRef.current){
            return;
        }
        hasLeftRef.current = true;
        expectedMsgIdRef.current = null; 

        if(!activeCall){
            setIncomingCall(null);
            setCalling(false);
            return;
        }

        socket.emit("leave_group_call",{
            groupId:activeCall.groupId,
            senderId,
            msgId:activeCall.msgId
        });

        setActiveCall(null);
        setIncomingCall(null);
        setCalling(false);
    },[activeCall,senderId]);

    useEffect(()=>{

        const handleUserAvailable=(data:{
            groupId:string;
            senderId:string;
            receiverId:string;
            msgId:string;
            messageType:CallType;
        })=>{
            if(String(data.receiverId)===String(senderId)){

                setIncomingCall(data);
                setCalling(false);

                clearIncomingTimer();

                incomingTimerRef.current=setTimeout(()=>{

                    socket.emit("group_call_no_response",{
                        groupId:data.groupId,
                        senderId,
                        msgId:data.msgId
                    });

                    setIncomingCall(null);

                },30000);
            }
        };

        const handleCallAccepted=(data:{
            groupId:string;
            senderId:string;
            LiveKitData:string;
            msgId:string;
            messageType:CallType;
        })=>{
            if(activeCallRef.current) return;
            if(
                expectedMsgIdRef.current !== "any-new" &&
                expectedMsgIdRef.current !== data.msgId
            ){
                return;
            }

            setCalling(false);
            hasLeftRef.current = false;
            expectedMsgIdRef.current = null;

            setActiveCall({
                groupId:data.groupId,
                msgId:data.msgId,
                messageType:data.messageType,
                liveKitData:data.LiveKitData
            });
        };

        const handleNewMember=(data:{
            groupId:string;
            userId:string;
            newMemberId:string;
            liveKitData:string;
            msgId:string;
            messageType:CallType;
        })=>{

            if(String(data.newMemberId)===String(senderId)){
                if(activeCallRef.current) return;
                if(
                    expectedMsgIdRef.current !== "any-new" &&
                    expectedMsgIdRef.current !== data.msgId
                ){
                    return;
                }

                setCalling(false);
                hasLeftRef.current = false;
                expectedMsgIdRef.current = null; // NEW

                setActiveCall({
                    groupId:data.groupId,
                    msgId:data.msgId,
                    messageType:data.messageType,
                    liveKitData:data.liveKitData
                });
            }
        };

        const handleMemberLeft=(data:{
            groupId:string;
            userId:string;
            leftMemberId:string;
            liveKitData:string;
            msgId:string;
            messageType:CallType;
        })=>{

            if(String(data.leftMemberId)===String(senderId)){
                return;
            }
        };

        const handleRejected=(data:{
            groupId:string;
            senderId:string;
            receiverId:string;
            msgId:string;
        })=>{

            if(String(data.senderId)===String(senderId)){
                setCalling(false);
            }
        };

        const handleNoResponse=(data:{
            groupId:string;
            senderId:string;
            callSendId:string;
        })=>{

            if(String(data.callSendId)===String(senderId)){
                setCalling(false);
            }
        };

        const handleError=(message:string)=>{
            setCalling(false);
            setCallError(message);
            setIncomingCall(null);
        };

        socket.on("user_available_for_call",handleUserAvailable);
        socket.on("user_accepted_group_call",handleCallAccepted);
        socket.on("new_member_added_in_groupCall",handleNewMember);
        socket.on("member_left_from_group_call",handleMemberLeft);
        socket.on("group_call_rejected",handleRejected);
        socket.on("no_response_of_call",handleNoResponse);
        socket.on("group_call_error",handleError);

        return()=>{

            clearIncomingTimer();

            socket.off("user_available_for_call",handleUserAvailable);
            socket.off("user_accepted_group_call",handleCallAccepted);
            socket.off("new_member_added_in_groupCall",handleNewMember);
            socket.off("member_left_from_group_call",handleMemberLeft);
            socket.off("group_call_rejected",handleRejected);
            socket.off("no_response_of_call",handleNoResponse);
            socket.off("group_call_error",handleError);
        };

    },[senderId]);

    return{
        incomingCall,
        activeCall,
        calling,
        callError,
        startGroupCall,
        acceptGroupCall,
        rejectGroupCall,
        joinOngoingCall,
        leaveGroupCall,
        setCallError
    };
}