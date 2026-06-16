import { useLocation } from "react-router-dom";
import { FiPaperclip, FiSmile } from "react-icons/fi";
import { useState } from "react";
import { chatTalk } from "../../hooks/use.chatTalk";
import "./chatPage.css";

const ChatPage=()=>{
  const location = useLocation();
  const data = location.state?.data;
  const data2=location.state?.data2;
  const [msg,setMsg]=useState<string>("");
  const colors = ["#FF6B6B","#4ECDC4","#45B7D1","#F7B731","#5F27CD","#10AC84","#EE5253","#2E86DE"];

  const {userMessage}=chatTalk();

  const handleSubmit=async(e:React.FormEvent)=>{
    e.preventDefault();
    if(!data._id || !data2.loginUserId)return;
    if(msg.trim()=== '')alert(('input field is empty'));
      const senderId=data2.loginUserId; const receiverId=data._id;
      userMessage({senderId,receiverId,msg});
  }
  return (
    <div className="chat">
      <div className="chatHeader">
        <div className="chatHeaderLeft">
          <div className="avat"style={{backgroundColor:colors[(data?.name?.charCodeAt(0) || 0) % colors.length]}}>
              {data?.name?.charAt(0).toUpperCase()}
                </div>

          <div className="userInfo"><h4>{data?.name}</h4></div>
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