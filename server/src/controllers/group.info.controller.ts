import { groupChatModel } from "../models/group.create.model";
import { groupMessage } from "../models/group.message.model";
import { Socket,Server } from "socket.io";
import { groupChat } from "../Socket/group.message.socket";












//all permission to show whether the user can edit this or not 
//and all the list of admin to show that this message are send by admin

export const profilePermission=async(data:{_id:string,senderId:string})=>{
    try{
        const group=await groupChatModel.findById(data._id);
        if(!group){
            throw new Error("group not found");
        }
        let groupNameChangePermission="cannot change name";
        //here on frontend we do if it is admin we show him that he/she can edit it
        if(group.canChangeGroupName){
            groupNameChangePermission="can change name";
        }
        let GroupImageChangePermission="cannot change image";
        if(group.canChangeGroupImage){
            GroupImageChangePermission="can change image";
        }
        await group.populate("admin","name avatar");
        const allAdmin=group.admin;
        const result={groupNameChangePermission,GroupImageChangePermission,allAdmin};
        return result;
    }catch(err){
        throw err;
    }
}


export const changeName=async(data:
    {_id:string,senderId:string,name:string},
    socket:Socket,io:Server,users:{[key:string]:string},
    activeGroupChats:Record<string,string>
)=>{
    try{
        const group=await groupChatModel.findById(data._id);
        if(!group){
        throw new Error("group not found");
        }
        if(data.name.trim().length<3 || data.name.trim().length>100){
    throw new Error("name should be at least 3 and at most 100 characters");
}
        if(group.canChangeGroupName){
                group.groupName=data.name;
                await group.save();
                for(let i=0;i<group.peoplesId.length;i++){
                    const id=group.peoplesId[i].toString();
                    const receiverSocketId=users[id];
                    if(receiverSocketId){
                      io.to(receiverSocketId).emit("group_name_changed",{groupId:group._id,name:group.groupName})
                    }
            }
            socket.emit("group_name_changed",{groupId:group._id,name:group.groupName})
            return group;
        }else{
          const checkAdmin=group.admin.some(
            (id)=>id.toString()===data.senderId.toString()  
        );
        if(checkAdmin){
            group.groupName=data.name;
                await group.save();
                for(let i=0;i<group.peoplesId.length;i++){
                    const id=group.peoplesId[i].toString();
                    const receiverSocketId=users[id];
                    if(receiverSocketId){
                     io.to(receiverSocketId).emit("group_name_changed",{groupId:group._id,name:group.groupName})
                    }
                }
            socket.emit("group_name_changed",{groupId:group._id,name:group.groupName})
            return group;
        }else{
            throw new Error("cannot edit name you don't have access");
        }
        }
    }catch(err){
        throw err;
    }
}










export const groupImage=async(data:
    {_id:string,senderId:string,message:string,mimetype:string},
    socket:Socket,io:Server,
    users:{[key:string]:string},
    activeGroupChats:Record<string,string>
)=>{
    try{
        const group=await groupChatModel.findById(data._id);
        if(!group){
            throw new Error("group not found");
        }

        if(!group.canChangeGroupImage){
            const checkIsAdmin=group.admin.some(
                (id)=>id.toString()===data.senderId.toString()
            );
            if(!checkIsAdmin){
                throw new Error("don't have access to change group image");
            }
        }
        group.groupImage=data.message;
        await group.save();

        for(let i=0;i<group.peoplesId.length;i++){
            const id=group.peoplesId[i].toString();
            if(id===data.senderId.toString())continue;
            const receiverSocketId=users[id];
            if(receiverSocketId){
                io.to(receiverSocketId).emit("group_image_changed",({groupId:data._id,message:group.groupImage}));
            }
        }
        socket.emit("group_image_changed",({groupId:data._id,message:group.groupImage}));
        return group;
    }catch(err){
        throw err;
    }
}












//here all the members with their info
export const AllMembers=async(data:{_id:string})=>{
    try{
        const group=await groupChatModel.findById(data._id);
        if(!group){
            throw new Error("group not fonud");
        }
        await group.populate("peoplesId","name avatar");
        return group.peoplesId;
    }catch(err){
        throw err;
    }
}







export const allAdmin=async(data:{_id:string})=>{
    try{
        const group=await groupChatModel.findById(data._id);
        if(!group){
            throw new Error("group not found");
        }
        await group.populate("admin","name avatar");
        return group;
    }catch(err){
        throw err;
    }
}