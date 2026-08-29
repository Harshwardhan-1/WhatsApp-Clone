import { groupChatModel } from '../models/group.create.model';
import { pollModel } from '../models/poll.model';
import  mongoose,{Types} from 'mongoose';
import {Socket,Server} from 'socket.io';
import { groupMessage } from '../models/group.message.model';
import { emitMessageInGroup } from './group.message.controller';
import { storeGroupLastMessage } from './group.lastMessage.controller';


export const addPoll=async(data:
    {_id:string,senderId:string,title:string,
        selectOptions:boolean,polldata:{
            msg:string,
            peoplesId:Types.ObjectId[],
        }[]},socket:Socket,io:Server,users:{[key:string]:string},
        activeGroupChats:Record<string,string>,
    )=>{
    try{
        const group=await groupChatModel.findById(data._id);
        if(!group){
            throw new Error("group not found");
        }
        const create=await pollModel.create({
            title:data.title,
            senderId:data.senderId,
            canSelectMultiple:data.selectOptions,
            options:data.polldata,
        });
        if(!create){
            throw new Error("failed to create poll");
        }
        // //now here we have to add peolesi in pole
        // for(let i=0;i<create.options.length;i++){
        //     for(let j=0;j<group.peoplesId.length;j++){
        //         create.options[i].peoplesId.push(new mongoose.Types.ObjectId(group.peoplesId[j]));
        //     }
        // }
        await create.save();
        const createMsg=await groupMessage.create({
            groupId:data._id,
            senderId:data.senderId,
            message:create._id.toString(),
            messageType:"poll",
        });
        if(!createMsg){
            throw new Error("failed to create message");
        }
        createMsg.isSend=true;
        const id=new mongoose.Types.ObjectId(data.senderId);
        createMsg.seenBy.push(id);
        createMsg.deliveredTo.push(id);
        await createMsg.save();


        await emitMessageInGroup(
            {_id:data._id.toString(),senderId:data.senderId},createMsg,users,activeGroupChats,socket,io);

        await storeGroupLastMessage({
            groupId:data._id,
            senderId:data.senderId,
            message:"pole",
            msgId:createMsg._id.toString(),
            messageType:"pole",
        },group);
    }catch(err){
        throw err;
    }
}





//when multile opitons in on

//_id is basically group id  pollId is the message the user likes or unlike
export const toggleLikeMultiple=async(data:{_id:string,msgId:string,pollId:string,senderId:string},
    socket:Socket,io:Server,users:{[key:string]:string},
    activeGroupChats:Record<string,string>,
)=>{
    try{
       const [group,msg]=await Promise.all([
        groupChatModel.findById(data._id),
        groupMessage.findById(data.msgId),
       ]);
       if(!group){
        throw new Error("group not found");
       }

       if(!msg){
        throw new Error("message not found");
       }
       const pollData=await pollModel.findById(msg.message);
       if(!pollData){
        throw new Error("poll not found for this group");
       }
        const poll=pollData.options.find(
            (option)=>option._id.toString()===data.pollId.toString()
        );
        if(!poll){
            throw new Error("this option not exist or delete by the user");
        }
        const checkLike=poll.peoplesId.some(
            (id)=>id.toString()===data.senderId.toString()
        );
        if(checkLike){
            poll.peoplesId=poll.peoplesId.filter(
                (id)=>id.toString()!==data.senderId.toString()
            );
        }else{
            poll.peoplesId.push(new mongoose.Types.ObjectId(data.senderId));
        }
        await pollData.save();

       for(let i=0;i<group.peoplesId.length;i++){
        const id=group.peoplesId[i].toString();
        const activeChats=activeGroupChats[id]===data._id.toString();
        const receiverSocketId=users[id];
        if(!receiverSocketId)continue;
        if(id===data.senderId.toString())continue;
        if(activeChats && receiverSocketId){
            io.to(receiverSocketId).emit("update_poll",(pollData));
        }
       }
       socket.emit("update_poll",(pollData));


       //now after this from frontend we woll again emit and get the current status of the poll
       //we will make that function downwards
    }catch(err){
        throw err;
    }
}








//multile likes not supported
export const toggleLike=async(data:
    {_id:string,msgId:string,pollId:string,senderId:string},
    socket:Socket,io:Server,users:{[key:string]:string},
    activeGroupChats:Record<string,string>,
)=>{
    try{
        const [group,msg]=await Promise.all([
            groupChatModel.findById(data._id),
            groupMessage.findById(data.msgId),
        ]);
        if(!group){
            throw new Error("group not found");
        }
        if(!msg){
            throw new Error("message not found");
        }
        const poll=await pollModel.findById(msg.message);
        if(!poll){
            throw new Error("poll not found");
        }
        for(let i=0;i<poll.options.length;i++){
            if(poll.options[i]._id.toString()!==data.pollId.toString()){
                poll.options[i].peoplesId=poll.options[i].peoplesId.filter(
                    (id)=>id.toString()!==data.senderId.toString()
                );
            }else{
                const alreadyVoted=poll.options[i].peoplesId.some(
                    (id)=>id.toString()===data.senderId.toString()
                );
                if(!alreadyVoted){
                poll.options[i].peoplesId.push(new mongoose.Types.ObjectId(data.senderId));
                }
            }
        }       
        await poll.save();
        for(let i=0;i<group.peoplesId.length;i++){
            const id=group.peoplesId[i].toString();
            const active=activeGroupChats[id]===data._id.toString();
            const receiverSocketId=users[id];
            if(id===data.senderId.toString())continue;
            if(active && receiverSocketId){
                io.to(receiverSocketId).emit("update_poll",(poll));
            }
        }
        socket.emit("update_poll",(poll));
    }catch(err){
        throw err;
    }
}











//_id is groupId msgId we required because poll id is in message
export const updateTitleName=async(data:
    {_id:string,msgId:string,pollId:string,senderId:string,title:string},
    socket:Socket,io:Server,users:{[key:string]:string},
    activeGroupsChats:Record<string,string>,
)=>{
    try{
        const [group,msg]=await Promise.all([
            groupChatModel.findById(data._id),
            groupMessage.findById(data.msgId),
        ]);
        if(!group){
            throw new Error("group not found");
        }
        if(!msg){
            throw new Error("msg not found");
        }
        const poll=await pollModel.findById(msg.message);
        if(!poll){
            throw new Error("poll not found");
        }
        if(poll.senderId.toString()!==data.senderId.toString()){
            throw new Error("you don't have access to update title of this poll");
        }
        poll.title=data.title;
        await poll.save();
        for(let i=0;i<group.peoplesId.length;i++){
            const id=group.peoplesId[i].toString();
            const active=activeGroupsChats[id]===data._id.toString();
            const receiverSocketId=users[id];
            if(!receiverSocketId || id===data.senderId.toString())continue;
            if(active && receiverSocketId){
                io.to(receiverSocketId).emit("update_poll",(poll));
            }
        }
        socket.emit("update_poll",(poll));
    }catch(err){
        throw err;
    }
}










//view votes
export const viewVotes=async(data:{_id:string,msgId:string,senderId:string},socket:Socket)=>{
    try{
        const [group,msg]=await Promise.all([
            groupChatModel.findById(data._id),
            groupMessage.findById(data.msgId),
        ]);
        if(!group){
            throw new Error("group not found");
        }
        if(!msg){
            throw new Error("msg not found");
        }
        const poll=await pollModel.findById(msg.message).populate("options.peoplesId","name avatar");
        if(!poll){
            throw new Error("poll not found");
        }

        let response=[];
        for(let i=0;i<poll.options.length;i++){
            const cnt=poll.options[i].peoplesId.length;
            response.push({
                _id:poll.options[i]._id.toString(),
                message:poll.options[i].msg,
                cnt,
                peoplesId:poll.options[i].peoplesId,
            });
        }
         socket.emit("view_votes",{msgId:data.msgId,votes:response});
    }catch(err){
        throw err;
    }
}










export const getPollDetails=async(data:{pollId:string,senderId:string},socket:Socket)=>{
    try{
        const poll=await pollModel.findById(data.pollId);
        if(!poll){
            throw new Error("poll not found");
        }
        socket.emit("poll_details",(poll));
    }catch(err){
        throw err;
    }
}