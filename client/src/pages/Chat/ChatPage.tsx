import { ShowAllUser } from "../../hooks/usechat.hooks";


const ChatPage=()=>{
    const {data,currentUserId}=ShowAllUser();
    return(
        <>
    
       {data.map((all,index)=>(
        <div key={index}>
            {all._id===currentUserId ? <p>{"You"}</p>:<p>{all.name}</p>}
        </div>
))}
        </>
    );
}



export default ChatPage;