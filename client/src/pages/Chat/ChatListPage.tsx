import { useState } from "react";
import { ShowAllUser } from "../../hooks/usechat.hooks";
import "./ChatListPage.css";

interface User {
  _id: string;
  name: string;
}

const colors: string[] = ["#22c55e","#ef4444", "#3b82f6", "#f59e0b",  "#ec4899", "#8b5cf6", "#06b6d4", "#14b8a6",];

const ChatPage =()=>{
  const {data,currentUserId}=ShowAllUser();
  const [search, setSearch] = useState<string>("");

  const getInitials=(name: string):string=>{return name.split(" ").map((word) => word[0]).slice(0, 2).join("").toUpperCase();};
  return (
    <>
    <div className="chatPage__container">
    <div className="chatPage">
      <div className="chatPage__header">
        <div className="chatPage__profile">Y</div>
        <div className="chatPage__icons">
          <span>⋮</span>
        </div>
      </div>

      <div className="chatPage__searchWrapper">
        <input type="text" placeholder="Search or start new chat" value={search}onChange={(e)=>setSearch(e.target.value)}className="chatPage__searchInput"/>
      </div>

      <div className="chatPage__userList">
        {data.filter((user: User)=>user.name.toLowerCase().includes(search.toLowerCase()))
           .map((all:User,index:number)=>(
            <div className="chatPage__userCard" key={all._id}>
              <div className="chatPage__avatar"style={{ backgroundColor: colors[index % colors.length],}}>
                {getInitials(all.name)}

                <span className="chatPage__onlineDot"></span>
              </div>
              <div className="chatPage__content"><h4 className="chatPage__name">{all._id === currentUserId? "You (You)": all.name}</h4></div>
            </div>
          ))}
      </div>
      <div>
      </div>
        <div className="right_side">
        <img src="/WhatsApp.svg" alt="" />
        <p>Select a chat to start messaging</p>
    </div>
    
    </div>
     <div className="right_side">
    <img src="/WhatsApp.svg" alt="" />
    <p>Select a chat to start messaging</p>
  </div>
    </div>
    </>
  );
};

export default ChatPage;