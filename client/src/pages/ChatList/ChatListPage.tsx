import { useState,useEffect } from "react";
import { ShowAllUser } from "../../hooks/usechat.hooks";
import { socket } from "../../utils/socket";
import "./ChatListPage.css";
import {motion,AnimatePresence} from 'framer-motion';

interface User {
  _id: string;
  name: string;
  email:string;
}

interface lastMessage{
senderId:string,
receiverId:string,
lastmessage:string,
messageType:string,
IsSend:boolean,
isDelivered:boolean,
isSeen:boolean,
updatedAt:string
}

interface chatlistUpdate{
senderId:string,
receiverId:string,
lastmessage:string,
messageType:string,
createdAt:string,
updatedAt:string
}

const colors: string[]=["#22c55e","#ef4444", "#3b82f6", "#f59e0b",  "#ec4899", "#8b5cf6", "#06b6d4", "#14b8a6",];
interface Props {
  selectedUser: User | null;
  setSelectedUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const ChatListPage = ({  setSelectedUser }: Props) => {
  const {data,userData}=ShowAllUser();//hook
  const [search, setSearch] = useState<string>("");
  const getInitials=(name: string):string=>{return name.split(" ").map((word) => word[0]).slice(0, 2).join("").toUpperCase();};
  const handleClick=async(all:User)=>{setSelectedUser(all)}
  const [lastMessages,setLastMessage]=useState<lastMessage[]>([]);
  
    const handleAllLastMessage=(data:lastMessage[])=>{
        setLastMessage(data);
    }

const handleChatListUpdate = (data: chatlistUpdate) => {
  setLastMessage((prev) => {
    const index = prev.findIndex((msg) => (msg.senderId === data?.senderId && msg.receiverId === data?.receiverId) || (msg.senderId === data?.receiverId && msg.receiverId === data?.senderId));
    if (!data?.lastmessage) {if (index !== -1) {const temp = [...prev];temp.splice(index, 1);return temp;}return prev;}
if (index !== -1) {const temp = [...prev];temp[index] = {...temp[index],lastmessage: data?.lastmessage, messageType: data?.messageType,updatedAt: data?.updatedAt,};return temp;}
    return [
      {
        senderId: data?.senderId,
        receiverId: data?.receiverId,
        lastmessage: data?.lastmessage,
        messageType: data?.messageType,
        IsSend: false,
        isDelivered: false,
        isSeen: false,
        updatedAt: data?.updatedAt,
      },
      ...prev,
    ];
  });
};
  
useEffect(()=>{
  const userId=userData?.loginUserId;
  if(!userId)return;
     socket.emit("join",userId);
     socket.emit("user_online",{userId:userId}); 
     socket.emit("last_message",{userId:userId});
     socket.on("all_last_message",handleAllLastMessage);
     socket.on("chat_list_update",handleChatListUpdate);
     return()=>{
      socket.off("user_online");
      socket.off("all_last_message",handleAllLastMessage);
      socket.off("chat_list_update",handleChatListUpdate);
     }
},[userData?.loginUserId]);

const sortedUsers = [...data].sort((a, b) => {const aLast = lastMessages.find((msg) =>(msg.senderId === userData?.loginUserId &&msg.receiverId === a._id) ||(msg.receiverId === userData?.loginUserId &&msg.senderId === a._id));
const bLast = lastMessages.find((msg) =>(msg.senderId === userData?.loginUserId &&msg.receiverId === b._id) ||(msg.receiverId === userData?.loginUserId &&msg.senderId === b._id));
const aTime = aLast ? new Date(aLast?.updatedAt).getTime() : 0;const bTime = bLast ? new Date(bLast?.updatedAt).getTime() : 0;
  return bTime - aTime;
});
  
  

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
     {
  data.filter((user:User)=>user.name.toLowerCase().includes(search.toLowerCase())).length===0 ?(
    <div className="noChatsFound">No records found</div>):
   <AnimatePresence mode="popLayout">
  {sortedUsers.filter((user: User) =>user.name.toLowerCase().includes(search.toLowerCase()))
    .map((all: User, index: number) => (
      <motion.div key={all._id}layout layoutId={all._id}className="chatPage__userCard"onClick={() => handleClick(all)}initial={{ opacity: 0 }} animate={{ opacity: 1 }}  exit={{ opacity: 0 }}transition={{  layout: {duration: 0.3,},}}>
       
       
        <div className="chatPage__avatar"style={{ backgroundColor: colors[index % colors.length] }}>
          {getInitials(all.name)}
          <span className="chatPage__onlineDot"></span>
        </div>
        <div className="chatPage__content">{(()=>{
    const last = lastMessages.find(
        (msg) =>(msg.senderId === userData?.loginUserId &&msg.receiverId === all._id) ||(msg.receiverId === userData?.loginUserId &&msg.senderId === all._id));
        // let tick = "";
        if (last?.senderId === userData?.loginUserId) {
        // if (last?.isSeen) {tick = "✓✓";}
        // else if (last?.isDelivered) { tick = "✓✓";} 
        // else if (last?.IsSend) {tick = "✓";}
    }

    let message = "";
    if (last) {
        switch (last.messageType) {
            case "image":message = "📷 Image";  break;
            case "video":message = "🎥 Video";break;
            case "pdf":message="pdf";break;
            default:message = last?.lastmessage;}}

    return (
        <>
            <div style={{ display: "flex",justifyContent: "space-between", alignItems: "center",}}>
                <h4 className="chatPage__name">{all.name}</h4>
                <span style={{ fontSize: "12px", color: "#667781" }}>
                    { last ? new Date(last.updatedAt).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit",}):""}
                </span>
            </div>
            <div style={{ display: "flex",  alignItems: "center",gap: "5px",}}>
                {last?.senderId === userData?.loginUserId &&(<span
                style={{color: last?.isSeen ? "#53bdeb" : "#8696a0",fontSize: "14px",}}>{}</span>)}
                <span style={{whiteSpace: "nowrap",overflow: "hidden",textOverflow: "ellipsis",width: "180px",color: "#667781",fontSize: "14px",}}>{message}</span>
            </div>
        </>
    );
})()}

</div>
      </motion.div>
    ))}
    </AnimatePresence>
}</div><div></div></div></div>
    </>
  );
};


export default ChatListPage;