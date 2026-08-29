import { useEffect, useState } from "react";
import './PollMessage.css';
import type { PollData, PollVoteDetail } from "../../hooks/Use.pole.hook";

interface PollMessageProps{
    msg:any;
    senderId:string;
    groupId:string;
    pollsById:Record<string,PollData>;
    fetchPollDetails:(pollId:string)=>void;
    votePoll:(data:{_id:string,msgId:string,pollId:string})=>void;
    votePollMultiple:(data:{_id:string,msgId:string,pollId:string})=>void;
    updatePollTitle:(data:{_id:string,msgId:string,pollId:string,title:string})=>void;
    viewPollVotes:(data:{_id:string,msgId:string})=>void;
    voteDetails:Record<string,PollVoteDetail[]>;
}

export function PollMessage({
    msg,senderId,groupId,pollsById,fetchPollDetails,
    votePoll,votePollMultiple,updatePollTitle,
    viewPollVotes,voteDetails,
}:PollMessageProps){

    const pollId=msg.message as string;
    const poll=pollsById[pollId];

    const [isEditing,setIsEditing]=useState(false);
    const [titleDraft,setTitleDraft]=useState("");
    const [showVotesModal,setShowVotesModal]=useState(false);

    useEffect(()=>{
        if(!poll){
            fetchPollDetails(pollId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[pollId]);

    if(!poll){
        return(
            <div className="poll-card poll-loading">
                <span>Loading poll...</span>
            </div>
        );
    }

    const isOwner=poll.senderId?.toString()===senderId?.toString();
    const totalVotes=poll.options.reduce((sum,opt)=>sum+(opt.peoplesId?.length || 0),0);

    // isi poll ka vote-list nikal rahe hain object se, msg._id se index karke
    const currentVoteDetails = voteDetails[msg._id] || [];

    const handleOptionClick=(optionId:string)=>{
        const payload={_id:groupId,msgId:msg._id,pollId:optionId};
        if(poll.canSelectMultiple){
            votePollMultiple(payload);
        }else{
            votePoll(payload);
        }
    };

    const startEdit=()=>{
        setTitleDraft(poll.title);
        setIsEditing(true);
    };

    const saveTitle=()=>{
        if(titleDraft.trim().length===0)return;
        updatePollTitle({_id:groupId,msgId:msg._id,pollId:poll._id,title:titleDraft.trim()});
        setIsEditing(false);
    };

    const cancelEdit=()=>setIsEditing(false);

    const openVotes=()=>{
        viewPollVotes({_id:groupId,msgId:msg._id});
        setShowVotesModal(true);
    };

    return(
        <div className="poll-card">
            <div className="poll-header">
                <span className="poll-icon">📊</span>

                {isEditing ? (
                    <div className="poll-title-edit">
                        <input
                            type="text"
                            value={titleDraft}
                            onChange={(e)=>setTitleDraft(e.target.value)}
                            autoFocus
                        />
                        <button type="button" onClick={saveTitle}>✓</button>
                        <button type="button" onClick={cancelEdit}>✕</button>
                    </div>
                ):(
                    <span className="poll-title">{poll.title}</span>
                )}

                {isOwner && !isEditing && (
                    <button className="poll-edit-btn" onClick={startEdit} title="Edit title">✎</button>
                )}
            </div>

            <div className="poll-subtext">
                {poll.canSelectMultiple ? "Select one or more" : "Select one"}
            </div>

            <div className="poll-options">
                {poll.options.map((option)=>{
                    const votedIds=option.peoplesId || [];
                    const cnt=votedIds.length;
                    const percent=totalVotes>0 ? Math.round((cnt/totalVotes)*100):0;
                    const hasVoted=votedIds.some((id)=>id?.toString()===senderId?.toString());

                    return(
                        <div
                            key={option._id}
                            className={`poll-option${hasVoted ? " poll-option-selected":""}`}
                            onClick={()=>handleOptionClick(option._id)}
                        >
                            <div className="poll-option-bar" style={{width:`${percent}%`}} />
                            <div className="poll-option-content">
                                <span className="poll-option-check">{hasVoted ? "●" : "○"}</span>
                                <span className="poll-option-text">{option.msg}</span>
                                <span className="poll-option-percent">{percent}%</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="poll-footer">
                <span>{totalVotes} vote{totalVotes!==1 ? "s":""}</span>
                <button type="button" className="poll-view-votes-btn" onClick={openVotes}>
                    View votes
                </button>
            </div>

            {showVotesModal && (
                <div className="pollVotesOverlay" onClick={()=>setShowVotesModal(false)}>
                    <div className="pollVotesBox" onClick={(e)=>e.stopPropagation()}>
                        <div className="pollVotesHeader">
                            <h4>Votes</h4>
                            <button onClick={()=>setShowVotesModal(false)}>✕</button>
                        </div>
                        {currentVoteDetails.length===0 ? (
                            <p className="pollVotesEmpty">No votes yet</p>
                        ) : (
                            currentVoteDetails.map((detail)=>(
                                <div key={detail._id} className="pollVotesOptionBlock">
                                    <div className="pollVotesOptionHeader">
                                        <span>{detail.message}</span>
                                        <span>{detail.cnt} vote{detail.cnt!==1?"s":""}</span>
                                    </div>
                                    {detail.peoplesId.length===0 ? (
                                        <p className="pollVotesNoOne">No one voted this option</p>
                                    ):(
                                        detail.peoplesId.map((person)=>(
                                            <div key={person._id} className="pollVotesPersonRow">
                                                <span>{person._id===senderId ? "You" : person.name}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}