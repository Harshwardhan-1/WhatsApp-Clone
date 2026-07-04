import { FiPaperclip, FiSmile } from "react-icons/fi";
import { useEffect, useState } from "react";
import { ChatTalk } from "../../hooks/use.chatTalk";
import { showApiError } from "../../utils/showApiError";
import { MessageAction } from "../../actions/message.action";
import type { Message } from "../../hooks/use.chatTalk";
import "./chatPage.css";

interface User {
    _id: string;
    name: string;
    email: string;
}

interface CurrentUser {
    loginUserId: string;
    email: string;
}

interface Props {
    data: User;
    data2: CurrentUser;
}


const ChatPage = ({ data, data2 }: Props) => {
  const [msg,setMsg]=useState<string>("");
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const colors = ["#FF6B6B","#4ECDC4","#45B7D1","#F7B731","#5F27CD","#10AC84","#EE5253","#2E86DE"];


  const {userMessage,allmessages,userpresence,status,presence,activeChats,notActiveChats,user_open_chat}=ChatTalk(data, data2);
  const {deleteForEveryone,delete_from_me,update_message}=MessageAction();


  useEffect(()=>{
    if(!data._id)return;
     userpresence(data._id);
     if(!data2.loginUserId || !data._id)return;
     activeChats({senderId:data2.loginUserId,receiverId:data._id});
     user_open_chat({senderId:data2.loginUserId,receiverId:data._id});
     return()=>{
      notActiveChats({senderId:data2.loginUserId,receiverId:data._id});
     }

  },[data._id,data2.loginUserId,activeChats,notActiveChats,user_open_chat,userpresence]);



  const handleSubmit=async(e:React.FormEvent)=>{
    e.preventDefault();
    if(!data._id || !data2.loginUserId){
      showApiError("any id is missing");
      return;
    }
    if(msg.trim()=== ''){
      showApiError("input field can't be empty");
      return;
    }
      const senderId=data2.loginUserId; 
      const receiverId=data._id;
      const messageType="text"
      userMessage({senderId,receiverId,msg,messageType});
      setMsg('');
  }


  const [editingId,setEditingId]=useState<string | null>(null);
  const [editText,setEditText]=useState<string>("");
  //edit logic
  const handleEdit=(all:Message)=>{
    setEditText(all.message);
    setEditingId(all._id);
  }

  
  return (
    <div className="chat">
      <div className="chatHeader">
        <div className="chatHeaderLeft">
          <div className="avat"style={{backgroundColor:colors[(data?.name?.charCodeAt(0) || 0) % colors.length]}}>
              {data?.name?.charAt(0).toUpperCase()}
                </div>

          <div className="userInfo"><h4>{data?.name}</h4>
          <p>{status=== "online" ? "🟢online":presence?presence:"⚫offline"}</p>
        </div>
        </div>
      </div>

      <div className="chatBody">
        <div className="encryptBox">
           Messages are end-to-end encrypted. No one outside this chat can read or listen to them.
        </div>

        <p>jisko message bhejna ha uski id {data?._id}</p> 
        <p>jisko message bhejna ha uska email {data?.email}</p>
        <p>jo message karenga uski id {data2.loginUserId}</p> 
        <p>jo message karenga uska email {data2.email}</p>

<div className="chat-body">
  {allmessages.map((all, index) => {
    const isSender = all.senderId === data2.loginUserId;

    return (
      <div key={index}className={`message ${isSender ? "sender" : "receiver"}`}>
        {editingId === all._id ? (<div className="editBox">
    <input value={editText}onChange={(e) => setEditText(e.target.value)}className="editInput"/>
    <div className="editActions">
      <button onClick={() => {setEditingId(null);}}>Cancel</button>
      <button onClick={() => {update_message({_id: all._id,senderId: data2.loginUserId,receiverId: data._id,msg: editText}); setEditingId(null);}}>Save </button>
    </div>

  </div>
) : (
  <>
  <div>{all.message}</div>
  <div className="message-time">{new Date(all.createdAt).toLocaleTimeString([], {hour: "numeric",minute: "2-digit",hour12: true,})}
</div>
  {isSender && (<div className="message-status">
        {all.isSeen ? (
         <span style={{ color: "blue" }}>✓✓</span>):all.isDelivered ? (<span>✓✓</span>) : all.IsSend ? (<span>✓</span> ) : null}</div>)}
  </>
)}
        <div className="menu-container">
        <button className="menu-btn"onClick={() =>setOpenMenu(openMenu === index ? null : index)}>⋮</button>

          {openMenu === index && (
            <div className="menu-dropdown">{isSender ? (
                <>
                  <div className="menu-item" onClick={() => {handleEdit(all); setOpenMenu(null);}}>Edit</div>
                  <div className="menu-item" onClick={() => {delete_from_me({_id:all._id,senderId:data2.loginUserId,receiverId:all.receiverId}); setOpenMenu(null);}}>Delete For Me  </div>
                  <div className="menu-item" onClick={() => {deleteForEveryone({_id:all._id,senderId:all.senderId,receiverId:all.receiverId}); setOpenMenu(null);}}>Delete For Everyone </div>
                </>
              ):(
                <div
                  className="menu-item"onClick={() => {delete_from_me({_id:all._id,senderId:data2.loginUserId,receiverId:all.receiverId});setOpenMenu(null);}}>Delete For Me </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  })}
</div>

      

      </div>
      <div className="chatFooter">
        <FiSmile className="footerIcon" />
        <FiPaperclip className="footerIcon" />

        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="type your message here"  value={msg} onChange={(e)=>setMsg(e.target.value)}/>
          <button type="submit">send</button>
        </form>
      </div>
    </div>
    
  );
};

export default ChatPage;