import { useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { groupChatHook } from "../../hooks/use.groupChat.hook";
import { AddGroupMembersModal } from "../../components/AddGroupMembers/AddGroupMembersModel";
import "./GroupChatPage.css";
import { useEffect } from "react";
import { socket } from "../../utils/socket";
import { MsgInfo } from "../../components/msgInfo/msgInfo";
import EmojiPicker from "emoji-picker-react";
import axios from "axios";
import {env} from '../../configs/env.config';
import { showApiError } from "../../utils/showApiError";
import { GroupMedia } from "../../components/GroupMedia/media/media";
import { GroupDocs } from "../../components/GroupMedia/docs/docs";
import { renderMessageWithLinks } from "../../utils/linkify/linkify";
import { GroupLinks } from "../../components/GroupMedia/links/link";
import { GroupMuteNotification } from "../../components/GroupMuteNotification/GroupMuteNotification";



const senderColors = ["#e542a3", "#f5793a", "#00a884", "#7c5cff", "#00afaf", "#e64980", "#f76707", "#1c7ed6"];

function getSenderColor(id: string) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return senderColors[Math.abs(hash) % senderColors.length];
}

// converts sizeInKb (only source used, since sizeInMb field is stored buggy in db)
// to a human readable KB/MB label
function formatFileSize(sizeInKb?: number) {
    if (sizeInKb === undefined || sizeInKb === null || isNaN(sizeInKb)) return "";
    if (sizeInKb < 1024) return `${sizeInKb.toFixed(2)} KB`;
    return `${(sizeInKb / 1024).toFixed(2)} MB`;
}

// builds a usable src/href from fileUrl, handling relative paths from backend
function resolveFileUrl(fileUrl?: string) {
    if (!fileUrl) return "";
    if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) return fileUrl;
    return `${env.backendUrl}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
}


    function Tick({ isSeen, isDelivered, isSend }: { isSeen: boolean; isDelivered: boolean; isSend: boolean }) {
  if (isSeen) return <span className="tick tick-seen">✓✓</span>;
  if (isDelivered) return <span className="tick tick-delivered">✓✓</span>;
  if (isSend) return <span className="tick tick-sent">✓</span>;
  return null;
}

export function GroupChat() {
    const location = useLocation();
    const senderId = location.state?.senderId;

    const { users,
         allGroupsList,
         sendMessage,
         messages,
         setGroupId,
         handleDeleteFromEveryone ,
         handelDeleteFromMy,
         handleEditMessage,
         messageInfo,
         groupEmoji,
         groupFile,
         clearGroupChatUser,
        } = groupChatHook(senderId);
    const [showModal, setShowModal] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<any>(null);
    const [message,setMessage]=useState<string>("");
    const [showMsgInfo, setShowMsgInfo] = useState(false);
    const [selectedMsgId, setSelectedMsgId] = useState<string>("");
    const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
    const [editText, setEditText] = useState<string>("");

    const [reactionMessage, setReactionMessage] = useState<string | null>(null);
    const [showReactionDetail, setShowReactionDetail] = useState<string | null>(null);
    const reactionRef = useRef<HTMLDivElement | null>(null);
    const reactionDetailRef = useRef<HTMLDivElement | null>(null);


    useEffect(()=>{
        if(!selectedGroup?._id || !senderId)return;
        setGroupId(selectedGroup?._id);
        socket.emit("active_group_user",({senderId:senderId,groupId:selectedGroup?._id}));
        socket.emit("previousMessage",{_id:selectedGroup._id,senderId:senderId});
        socket.emit("user_open_group_chat",({_id:selectedGroup._id,senderId:senderId}));

        return()=>{
            socket.emit("not_activeGroupChatUser",({senderId:senderId,groupId:selectedGroup?._id}));
        }
    },[selectedGroup?._id,senderId]);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (reactionRef.current && !reactionRef.current.contains(event.target as Node)) {
                setReactionMessage(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (reactionDetailRef.current && !reactionDetailRef.current.contains(event.target as Node)) {
                setShowReactionDetail(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return()=>document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    const handleSubmit=async(e:React.FormEvent<HTMLFormElement>)=>{
        e.preventDefault();
        try{
            if(message.trim().length===0){
                alert("message field cannot be empty");
                return;
            }
            sendMessage({_id:selectedGroup._id,senderId,message,messageType:"text"});
            setMessage('');
        }catch(err){
            throw err;
        }
    }


    const handleDeleteForEveryone=(_id:string)=>{
        handleDeleteFromEveryone({_id:selectedGroup._id,msgId:_id,senderId});
    }


    const handleDeleteForMe=(_id:string)=>{
        handelDeleteFromMy({_id:selectedGroup._id,msgId:_id,senderId});
    }

    const handleEdit=(msg:any)=>{
        setEditingMsgId(msg._id);
        setEditText(msg.message);
    }

    const cancelEdit=()=>{
        setEditingMsgId(null);
        setEditText("");
    }



    const saveEdit=(_id:string)=>{
        handleEditMessage({_id:selectedGroup._id,msgId:_id,message:editText,senderId});
        // setEditingMsgId(null);
        // setEditText("");
    }


    const handleMsgInfo = (_id:string) => {
    setSelectedMsgId(_id);
    setShowMsgInfo(true);
    messageInfo({ _id: selectedGroup._id, msgId: _id, senderId });
}

    const getMemberName = (userId: string) => {
        const person = selectedGroup?.peoplesId?.find((p: any) => p._id === userId);
        return person?.name || "Unknown";
    };

    const groupReactions = (reactions: { userId: string; emoji: string }[] = []) => {
        return reactions.reduce((acc, r) => {
            if (!acc[r.emoji]) acc[r.emoji] = [];
            acc[r.emoji].push(r.userId);
            return acc;
        }, {} as Record<string, string[]>);
    };


    const handleEmojiReaction=(_id:string,emoji:string)=>{
        groupEmoji({_id:selectedGroup._id,msgId:_id,senderId,emoji});
    };

    const handleRemoveReaction = (msgId: string, currentEmoji: string) => {
        handleEmojiReaction(msgId, currentEmoji);
        setShowReactionDetail(null);
    };



    const [file,setFile]=useState<File>();
      const [activeOption, setActiveOption] = useState<string | null>(null);
    



    const handleFileSubmit=async(e:React.FormEvent<HTMLFormElement>)=>{
        e.preventDefault();
        if(!file){
            alert("file not found");
            return;
        }
        try{
        const formData=new FormData();
        formData.append("file",file);

        const res=await axios.post(`${env.backendUrl}/api/v1/upload`,formData,{withCredentials:true});
        if(res.data.success){
            const data=res.data.data;
            groupFile({_id:selectedGroup._id,senderId,message:data.path,messageType:"file",
                fileUrl:data.path,mimetype:data.mimetype,sizeInKb:data.sizeInKb,sizeInMb:data.sizeInMb,
                filename:data.fileName,orignalname:data.orignalname,
            });
        }
        }catch(err){
            showApiError(err);
            console.log(err);
        }
    }

   const [showMenu,setShowMenu]=useState<boolean>(false);











  
  const handleSelect=(value:string)=>{
    if(value==="clear chat"){
        if(!window.confirm("confirm you want to clear chat")){
            return;
        }
        clearGroupChatUser({_id:selectedGroup._id,senderId});
        return;
    }
    if(value==="media"){
      setActiveOption("media");
      setShowMenu(false);
    }
    if(value==="docs"){
        setActiveOption("docs");
        setShowMenu(false);
    }
    if(value==="links"){  
      setActiveOption("links");
      setShowMenu(false);
    }
    if(value==="mute notification"){
        setActiveOption("mute notification");
        setShowMenu(false);
    }
  }
    return (
        <div className="group-chat">

            {/* LEFT : GROUP LIST */}
            <div className="group-list">
                <button onClick={() => setShowModal(true)}>Create Group</button>
                {allGroupsList?.map((group: any) => (

                    <div key={group._id}className="group-item" onClick={() => setSelectedGroup(group)}>
                        {group.groupName}
                    </div>
                ))}

            </div>

            {/* RIGHT : CHAT */}
            <div className="group-chat-area">
                {!selectedGroup ? (
                    <div className="whatsapp-screen">
                        <img src="/WhatsApp.svg"  alt="WhatsApp"/>
                    </div>
                ) : ( 
                 <div className="chat-screen"> 

          <div className="chatOptions">
        <button className="threeDotBtn" onClick={() => setShowMenu(prev => !prev)}>⋮</button>
        {showMenu && (
            <div className="optionsMenu">
                <button onClick={() => handleSelect("clear chat")}>Clear chat</button>
                <button onClick={() => handleSelect("disappearing message")}>Disappearing messages</button>
                <button onClick={() => handleSelect("mute notification")}>Mute notifications</button>
                <button onClick={() => handleSelect("media")}>Media</button>
                <button onClick={() => handleSelect("docs")}>Docs</button>
                <button onClick={() => handleSelect("links")}>Links</button>
            </div>
        )}
    </div>

    {
      activeOption==="media" && (
        <GroupMedia
        onBack={()=>setActiveOption(null)}
        _id={selectedGroup._id}
        senderId={senderId}
        />
      )}


      {
      activeOption==="docs" && (
        <GroupDocs
        onBack={()=>setActiveOption(null)}
        _id={selectedGroup._id}
        senderId={senderId}
        />
      )}


      
      {
      activeOption==="links" && (
        <GroupLinks
        onBack={()=>setActiveOption(null)}
        _id={selectedGroup._id}
        senderId={senderId}
        />
      )}



      {
      activeOption==="mute notification" && (
        <GroupMuteNotification
        onBack={()=>setActiveOption(null)}
        _id={selectedGroup._id}
        senderId={senderId}
        />
      )}
      




        <div className="chat-header"> 
            <div className="chat-logo"> 
                {selectedGroup.groupLogo ? ( 
                    <img src={selectedGroup.groupLogo} alt="group logo" /> 
                ) : ( 
                    <span>
                        {selectedGroup.groupName?.charAt(0)?.toUpperCase()}
                    </span> 
                )} 
            </div> 
            <div className="chat-header-info">
                <h2>{selectedGroup.groupName}</h2>
                <p>{selectedGroup.peoplesId?.map((person: any, index: number) => (
                <span key={person._id || index}>{person._id === senderId ? "(You)" : person.name}
            {index < selectedGroup.peoplesId.length - 1 ? ", " : ""}
        </span>
    ))}
</p>
            </div>
        </div> 
      <div className="messages-area">
  {messages?.map((msg: any, index: number) => {
 const msgSenderId = typeof msg.senderId === "object" ? msg.senderId?._id : msg.senderId;
    const isSender = msgSenderId?.toString() === senderId?.toString();
    const isSystem = msg.messageType === "system"; 
    const isText = msg.messageType === "text";
    const isFileMsg = msg.messageType === "file";
    const isImage = isFileMsg && msg.mimetype?.startsWith("image");
    const isVideo = isFileMsg && msg.mimetype?.startsWith("video");
    const isPdf = isFileMsg && msg.mimetype === "application/pdf";
    const isOtherFile = isFileMsg && !isImage && !isVideo && !isPdf;
    const fileSrc = isFileMsg ? resolveFileUrl(msg.fileUrl) : "";
    const displayFileName = msg.orignalname || msg.filename || "file";

    if (isSystem) {
      return (
        <div key={msg._id || index} className="system-message">
          {msg.message}
        </div>
      );
    }

    return (
      <div key={msg._id || index} className={isSender ? "message sender" : "message receiver"}>
        {!isSender && (
      <span className="message-sender-name" style={{ color: getSenderColor(msgSenderId?.toString() || "") }}>
        {typeof msg.senderId === "object" ? msg.senderId?.name : ""}
      </span>
    )}

        {isText && (
          <span className="message-text">{renderMessageWithLinks(msg.message)}</span>
        )}

        {isImage && (
          <div className="message-file message-image">
            <img
              src={fileSrc}
              alt={displayFileName}
              className="message-image-preview"
              onClick={() => window.open(fileSrc, "_blank")}
            />
            <div className="file-meta">
              <span className="file-size">{formatFileSize(msg.sizeInKb)}</span>
            </div>
          </div>
        )}

        {isVideo && (
          <div className="message-file message-video">
            <video src={fileSrc} controls className="message-video-preview" />
            <div className="file-meta">
              <span className="file-size">{formatFileSize(msg.sizeInKb)}</span>
            </div>
          </div>
        )}

        {isPdf && (
          <a href={fileSrc} target="_blank" rel="noopener noreferrer" className="message-file message-doc">
            <div className="file-icon pdf-icon">PDF</div>
            <div className="file-info">
              <span className="file-name">{displayFileName}</span>
              <span className="file-size">{formatFileSize(msg.sizeInKb)}</span>
            </div>
          </a>
        )}

        {isOtherFile && (
          <a href={fileSrc} target="_blank" rel="noopener noreferrer" download className="message-file message-doc">
            <div className="file-icon generic-icon">📄</div>
            <div className="file-info">
              <span className="file-name">{displayFileName}</span>
              <span className="file-size">{formatFileSize(msg.sizeInKb)}</span>
            </div>
          </a>
        )}

        <button className="reaction-btn" onClick={() => setReactionMessage(msg._id)}>
          😊
        </button>

        {reactionMessage === msg._id && (
          <div className="emoji-picker-popup" ref={reactionRef}>
            <EmojiPicker
              onEmojiClick={(emojiData) => {
                handleEmojiReaction(msg._id, emojiData.emoji);
                setReactionMessage(null);
              }}
            />
          </div>
        )}

        {msg.reaction && msg.reaction.length > 0 && (
          <div className="reaction-badge" onClick={() => setShowReactionDetail(msg._id)}>
            {Object.keys(groupReactions(msg.reaction)).slice(0, 3).map((emoji: string) => (
              <span key={emoji}>{emoji}</span>
            ))}
            {msg.reaction.length > 1 && <span className="reaction-count">{msg.reaction.length}</span>}
          </div>
        )}

        {showReactionDetail === msg._id && (
          <div className="reaction-detail-popup" ref={reactionDetailRef}>
            <div className="reaction-detail-header">
              {msg.reaction.length} reaction{msg.reaction.length > 1 ? "s" : ""}
            </div>

            <div className="reaction-pills-row">
              <button className="add-reaction-pill" onClick={() => setReactionMessage(msg._id)}>
                😊+
              </button>
              {Object.entries(groupReactions(msg.reaction)).map(([emoji, users]: [string, any]) => (
                <div key={emoji} className="reaction-pill">
                  <span>{emoji}</span>
                  <span>{users.length}</span>
                </div>
              ))}
            </div>

            <div className="reaction-divider" />

            <div className="reaction-user-list">
              {msg.reaction.map((r: any) => {
                const isMe = r.userId === senderId;
                return (
                  <div key={r.userId} className="reaction-user-row"onClick={()=>isMe && handleRemoveReaction(msg._id, r.emoji)}>
                    <div className="reaction-avatar" style={{ backgroundColor: isMe ? "#00a884" : getSenderColor(r.userId) }}>
                      {isMe ? "Y" : getMemberName(r.userId).charAt(0).toUpperCase()}
                    </div>
                    <div className="reaction-user-info">
                      <span className="reaction-user-name">{isMe ? "You" : getMemberName(r.userId)}</span>
                      {isMe && <span className="reaction-remove-hint">Click to remove</span>}
                    </div>
                    <span className="reaction-emoji-large">{r.emoji}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <span className="message-meta">
          {msg.isEdited && <span className="message-edited">edited</span>}
          {isSender && (<Tick isSeen={msg.isSeen} isDelivered={msg.isDelivered} isSend={msg.isSend} />)}
        </span>
        <div className="message-menu">
          <button className="menu-button">⋮</button>
          <div className="message-menu-dropdown">
            {!isSender ? (
              <>
                <button onClick={()=>handleDeleteForMe(msg._id)}>Delete for me</button>
                {isText && <button onClick={() => navigator.clipboard.writeText(msg.message)}>Copy</button>}
              </>
            ) : (
              <>


                {isText && <button onClick={()=>handleEdit(msg)}>Edit</button>}
                <button onClick={()=>handleDeleteForMe(msg._id)}>Delete for me</button>
                <button onClick={()=>handleDeleteForEveryone(msg._id)}>Delete for everyone</button>
                <button onClick={()=>handleMsgInfo(msg._id)}>Msg Info</button>


                {isText && (<button onClick={() => navigator.clipboard.writeText(msg.message)}>Copy</button>
)}
              </>
            )}
          </div>
        </div>

        {editingMsgId === msg._id && (
          <div className="inline-edit-box">
            <input  type="text" value={editText}  onChange={(e) => setEditText(e.target.value)}autoFocus/>
            <button type="button" onClick={() => saveEdit(msg._id)}>Save</button>
            <button type="button" onClick={cancelEdit}>Cancel</button>
          </div>
        )}
      </div>
    );
  })}
</div>
        <form onSubmit={handleSubmit} className="message-form"> 
            <input  type="text"  placeholder="send message" value={message}  onChange={(e)=>setMessage(e.target.value)}/> 
            <button type="submit">Send</button>  
        </form> 

        <form onSubmit={handleFileSubmit} className="message-form">
            <input type="file" placeholder="send message" onChange={(e)=>setFile(e.target.files?.[0])} />
            <button type="submit">Send</button>
        </form>


    </div> 
     )}
     <MsgInfo
    open={showMsgInfo}
    onClose={() => setShowMsgInfo(false)}
    messageId={selectedMsgId}
/>
            </div>

            {showModal && (
                <AddGroupMembersModal
                    users={users}
                    selectedIds={selectedIds}
                    setSelectedIds={setSelectedIds}
                    senderId={senderId}
                    onClose={() => setShowModal(false)}
                />
            )}

        </div>
    );
}