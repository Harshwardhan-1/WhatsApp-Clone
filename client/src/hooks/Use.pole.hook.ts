import { useState, useEffect, useRef } from "react";
import { socket } from "../utils/socket";

export interface PollOption{
    _id:string;
    msg:string;
    peoplesId:string[];
}

export interface PollData{
    _id:string;
    title:string;
    senderId:string;
    canSelectMultiple:boolean;
    options:PollOption[];
}

export interface PollVoteDetail{
    _id:string;
    message:string;
    cnt:number;
    peoplesId:{_id:string;name:string;avatar?:string}[];
}

export function usePollHook(senderId:string){
    const [pollsById,setPollsById]=useState<Record<string,PollData>>({});
    // voteDetails ab poll ke msgId se keyed object hai, isse alag alag polls ka data mix nahi hoga
    const [voteDetails,setVoteDetails]=useState<Record<string,PollVoteDetail[]>>({});
    const pendingFetch=useRef<Set<string>>(new Set());

    useEffect(()=>{
        const handlePollDetails=(poll:PollData)=>{
            if(!poll || !poll._id)return;
            pendingFetch.current.delete(poll._id.toString());
            setPollsById(prev=>({...prev,[poll._id.toString()]:poll}));
        };

        const handleUpdatePoll=(poll:PollData)=>{
            if(!poll || !poll._id)return;
            setPollsById(prev=>({...prev,[poll._id.toString()]:poll}));
        };

        const handleViewVotes=(data:{msgId:string,votes:PollVoteDetail[]})=>{
            if(!data || !data.msgId)return;
            setVoteDetails(prev=>({...prev,[data.msgId]:data.votes}));
        };

        const handlePollError=(err:{message:string})=>{
            console.log("poll error:",err?.message);
        };

        socket.on("poll_details",handlePollDetails);
        socket.on("update_poll",handleUpdatePoll);
        socket.on("view_votes",handleViewVotes);
        socket.on("poll_error",handlePollError);

        return ()=>{
            socket.off("poll_details",handlePollDetails);
            socket.off("update_poll",handleUpdatePoll);
            socket.off("view_votes",handleViewVotes);
            socket.off("poll_error",handlePollError);
        };
    },[]);

    const createPoll=(data:{_id:string,title:string,selectOptions:boolean,
        polldata:{msg:string,peoplesId:string[]}[]})=>{
        socket.emit("create_poll",{...data,senderId});
    };

    const fetchPollDetails=(pollId:string)=>{
        if(pendingFetch.current.has(pollId) || pollsById[pollId])return;
        pendingFetch.current.add(pollId);
        socket.emit("get_poll_details",{pollId,senderId});
    };

    const votePoll=(data:{_id:string,msgId:string,pollId:string})=>{
        socket.emit("toggle_poll_vote",{...data,senderId});
    };

    const votePollMultiple=(data:{_id:string,msgId:string,pollId:string})=>{
        socket.emit("toggle_poll_vote_multiple",{...data,senderId});
    };

    const updatePollTitle=(data:{_id:string,msgId:string,pollId:string,title:string})=>{
        socket.emit("update_poll_title",{...data,senderId});
    };

    const viewPollVotes=(data:{_id:string,msgId:string})=>{
        socket.emit("view_poll_votes",{...data,senderId});
    };

    return{
        pollsById,
        voteDetails,
        createPoll,
        fetchPollDetails,
        votePoll,
        votePollMultiple,
        updatePollTitle,
        viewPollVotes,
    };
}