import { useState } from "react";
import { ShowAllUser } from "../../hooks/usechat.hooks";
import { useNavigate } from "react-router-dom";
import "./ChatListPage.css";

interface User {
  _id: string;
  name: string;
  email:string;
}

const colors: string[]=["#22c55e","#ef4444", "#3b82f6", "#f59e0b",  "#ec4899", "#8b5cf6", "#06b6d4", "#14b8a6",];

const ChatPage =()=>{
  const navigate=useNavigate();
  const {data,userData}=ShowAllUser();
  const [search, setSearch] = useState<string>("");
  const getInitials=(name: string):string=>{return name.split(" ").map((word) => word[0]).slice(0, 2).join("").toUpperCase();};



  const handleClick=async(all:User)=>{
    navigate("/ChatPage",{state:{data:all,data2:userData}});
  }
  return (
    <>
    <div className="chatPage__container">
    <div className="chatPage">
      <div className="chatPage__header">
        <div className="chatPage__profile">{userData?.email?.charAt(0).toUpperCase()}</div>
        <div className="chatPage__icons">
          <span>⋮</span>
        </div>
      </div>

      <div className="chatPage__searchWrapper">
        <input type="text" placeholder="Search or start new chat" value={search}onChange={(e)=>setSearch(e.target.value)}className="chatPage__searchInput"/>
        <button>All</button>
        <button>Unread</button>
        <button>Favorites</button>
        <button>Groups</button>
      </div>

      <div className="chatPage__userList">
        {data.filter((user: User)=>user.name.toLowerCase().includes(search.toLowerCase()))
           .map((all:User,index:number)=>(
            <div className="chatPage__userCard" key={all._id} onClick={()=>handleClick(all)}>
              <div className="chatPage__avatar"style={{ backgroundColor: colors[index % colors.length],}}>
                {getInitials(all.name)}

                <span className="chatPage__onlineDot"></span>
              </div>
              <div className="chatPage__content"><h4 className="chatPage__name">{all._id === userData?.loginUserId ? "You (You)": all.name}</h4></div>
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