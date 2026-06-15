import { useLocation } from "react-router-dom";
import { FiPaperclip, FiSmile } from "react-icons/fi";
import "./chatPage.css";

const ChatPage = () => {
  const location = useLocation();
  const data = location.state?.data;
  const data2=location.state?.data2;

  return (
    <div className="chat">
      <div className="chatHeader">
        <div className="chatHeaderLeft">
          <div className="avatar">
            {data?.name?.charAt(0).toUpperCase()}
          </div>

          <div className="userInfo"><h4>{data?.name}</h4></div>
        </div>
      </div>

      <div className="chatBody">
        <div className="encryptBox">
           Messages are end-to-end encrypted. No one outside this chat can read or listen to them.
        </div>

        {/* Messages yaha render honge */}

        <p>jisko message bhejna ha uski id {data?._id}</p> 
        <p>jisko message bhejna ha uska email {data?.email}</p>
        <p>jo message karenga uski id {data2.loginUserId}</p> 
        <p>jo message karenga uska email {data2.email}</p>
      </div>
      <div className="chatFooter">
        <FiSmile className="footerIcon" />
        <FiPaperclip className="footerIcon" />

        <input type="text" placeholder="Type a message" />
        <button>send</button>
      </div>
    </div>
  );
};

export default ChatPage;