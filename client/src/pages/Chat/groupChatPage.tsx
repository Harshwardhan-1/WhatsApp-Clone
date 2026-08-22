import { useState } from "react";
import { useLocation } from "react-router-dom";
import { groupChatHook } from "../../hooks/use.groupChat.hook";
import { AddGroupMembersModal } from "../../components/AddGroupMembers/AddGroupMembersModel";

export function GroupChat(){
    const location=useLocation();
    const senderId=location.state?.senderId;

    const {users}=groupChatHook(senderId);
    const [showModal, setShowModal] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const handleCreate=()=>{
        setShowModal(true);
    }


    
    return(
        <>
        <h1>Group Chat</h1>
        <p>{senderId}</p>               

        <button onClick={handleCreate}>Create Group</button>

        {showModal && (
            <AddGroupMembersModal
                users={users}
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
                senderId={senderId}
                onClose={() => setShowModal(false)}
            />
        )}
        </>
    );
}