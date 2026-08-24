import {Socket,Server} from 'socket.io';
import { createGroup,groups } from '../controllers/group.management.controller';
import { 
    createMessage,
    deleteFromMe,
    deleteMessageFromEveryone,
    delieveredTo, 
    editGroupMessage, 
    emitMessageInGroup, 
    emoji, 
    messageInfo, 
    replyToParent, 
    seenByy, 
    showAllMessage 
} from '../controllers/group.message.controller';


export const groupChat=async(socket:Socket,users:{[key:string]:string},io:Server,activeGroupChats:Record<string,string>)=>{
    try{
        //in this we return all the groups in which user is joined
        socket.on("user_joined_group",async(senderId:string)=>{
            try{
                const allGroups=await groups({senderId});
                socket.emit("all_groups",(allGroups));
            }catch(err){
                const error=err instanceof Error?err.message:"Unknown Error";
                socket.emit("err_msg",error);
            }
        });
        socket.on("create_group",async(data)=>{
          const group=await createGroup(data);
          //here we will loop and emit update chat list 
        });
















        //message part
        socket.on("previousMessage",async(data)=>{
          const allMessage=await showAllMessage(data);
          socket.emit("all_previous_message",(allMessage));
        });



        

        ///very important 
        socket.on("send_group_message",async(data)=>{
            try{
             const msgData=await createMessage(data);
             await emitMessageInGroup({_id:data._id,senderId:data.senderId},msgData,users,activeGroupChats,socket,io);
            }catch(err){
                console.log(err);
                const error=err instanceof Error?err.message:"Unknown Error";
                socket.emit("error_msg",error);
            }
        });


        socket.on("add_to_delivered",async(data:{senderId:string})=>{
            await delieveredTo({senderId:data.senderId},users,socket,io,activeGroupChats);
        });

        socket.on("user_open_group_chat",async(data:{_id:string,senderId:string})=>{
            const message=await seenByy({_id:data._id,senderId:data.senderId},socket,io,users);
        });





        socket.on("delete_grp_msg_everyone",async(data:{_id:string,msgId:string,senderId:string})=>{
            try{
            await deleteMessageFromEveryone(data,socket,io,users,activeGroupChats);
            }catch(err){
                console.log(err);
                const error=err instanceof Error?err.message:"Unknown Error";
                socket.emit("error_msg",error);
            }
        });







        socket.on("delete_from_my_device",async(data)=>{
            try{
                await deleteFromMe(data);
                const allMsg=await showAllMessage({_id:data._id,senderId:data.senderId});
                 socket.emit("delete_by_me",{msgId:data.msgId,groupId:data._id});
            }catch(err){
                console.log(err);
                const error=err instanceof Error?err.message:"Unknown Error";
                socket.emit("error_msg",error);
            }
        });



        
        socket.on("edit_group_msg",async(data)=>{
            try{
                await editGroupMessage(data,socket,io,users,activeGroupChats);
            }catch(err){
                const error=err instanceof Error?err.message:"Unknown Error";
                socket.emit("error_msg",error);
            }
        });

        
        socket.on("msg_info",async(data)=>{
            const msg=await messageInfo(data);
            socket.emit("msg_info_data",(msg));
        });


        socket.on("group_emoji",async(data)=>{
          const msg=await emoji(data,socket,io,users,activeGroupChats);
        });




    }catch(err){
        const error=err instanceof Error?err.message:"Unknown Error";
        socket.emit("error_msg",error);
    }
} 