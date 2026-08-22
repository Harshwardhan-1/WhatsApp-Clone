import {Request,Response,NextFunction} from 'express';
import { groupChatModel } from '../models/group.create.model';
import mongoose from 'mongoose';
import { authRequest } from '../types/auth.Requests.types';
import  QRCode from "qrcode";
import { groupMessage } from '../models/group.message.model';





export const createGroup=async(data:{groupName:string,senderId:string,peoplesId:[]})=>{
    try{
        if(!data.groupName || !data.senderId){ 
            throw new Error("group name is required");
        }
        if(data.peoplesId.length===0){
          throw new Error("there should be atleast one person in the group");
        }

        const adminId=new mongoose.Types.ObjectId(data.senderId);
        const inviteToken=`${Date.now()}-${Math.round(Math.random()*1e9)}`;
        const create=await groupChatModel.create({
            inviteToken, 
            groupName:data.groupName,
            groupCreatorId:data.senderId,
        });
        if(!create){
            throw new Error("internal server error")
        }
        create.admin.push(adminId);
        for(let i=0;i<data.peoplesId.length;i++){
            const id=new mongoose.Types.ObjectId(data.peoplesId[i]);
            create.peoplesId.push(id);
        }
        create.peoplesId.push(adminId);
        await create.save();
        await create.populate("peoplesId","name avatar");
        await create.populate("groupCreatorId","name avatar");
        const creator:any=create.groupCreatorId;
        await groupMessage.create({
            groupId:create._id,
            senderId:data.senderId,
            message:`${creator.name} created this group`,
            messageType:"system",
        });
        return {message:"group created successfully",totalPeoples:create.peoplesId.length,create};
    }catch(err){
        throw err;
    }
}







//delete group
//api/v1/:id/:senderId,


export const deleteGroup=async(req:authRequest,res:Response,next:NextFunction)=>{
    try{
        const {id,senderId}=req.params;
        if(!id || !senderId){
            return res.status(400).json({
                success:false,
                message:"something went wrong or login again",
            });
        }
        if(!req.user){
            return res.status(401).json({
                success:false,
                message:"Unauthorized",
            });
        }
        const findGroup=await groupChatModel.findById({_id:id});
        if(!findGroup){
            return res.status(404).json({
                success:false,
                message:"group not found",
            });
        }
        if(findGroup.groupCreatorId.toString()!==senderId){
            return res.status(400).json({
                success:false,
                message:"not have permission to delete this group",
            });
        }
        await findGroup.deleteOne();
        return res.status(200).json({
            success:true,
            message:"group deleted successfully",
        });
    }catch(err){
        next(err);
    }
}







//update group name

export const updateGroupName=async(data:{_id:string,name:string,senderId:string})=>{
    try{
        const findGroup=await groupChatModel.findById(data._id);
        if(!findGroup){
            throw new Error("group not found");
        }
        if(findGroup.canChangeGroupName){
             findGroup.groupName=data.name;
             await findGroup.save();
            return findGroup;
        }else{
            const checkUser=findGroup.admin.some(
                (id)=>id.toString()===data.senderId.toString()
            );
            if(checkUser){
                //this means the person is admin and change change group name
                findGroup.groupName=data.name;
                await findGroup.save();
                await Promise.all([
                   findGroup.populate("peoplesId","name avatar"),
                   findGroup.populate("admin","name avatar")
                ]);
                return findGroup;
            }else{
                throw new Error("dont have permission to change the group named");
            }
        }
    }catch(err){
        throw err;
    }
}





export const updateGroupImage=async(req:authRequest,res:Response,next:NextFunction)=>{
    try{
        const {id,senderId}=req.body;
        const file=req?.file;
        if(!file || !id || !senderId){
            return res.status(400).json({
                success:false,
                message:""
            });
        }
        const findGroup=await groupChatModel.findById(id);
        if(!findGroup){
            return res.status(404).json({
                success:false,
                message:"group not found",
            });
        }
        if(findGroup.canChangeGroupImage){
            findGroup.groupImage=`/uploads/${file.originalname}`;
            await findGroup.save();
            return res.status(200).json({
                success:true,
                message:"successfull",
                file:{
                    orignalname:file.originalname,
                    filename:file.filename,
                    mimetype:file.mimetype,
                    path:`/uploads/${file.filename}`,
                },
            });
        }else{
            //here we will find if it is admin or not if admin allow
            const check=findGroup.admin.some(
                (id)=>id.toString()===senderId.toString()
            );
            if(check){
            findGroup.groupImage=`/uploads/${file.filename}`;
            await findGroup.save();
            return res.status(200).json({
                success:true,
                message:"successfull",
                file:{
                    orignalname:file.originalname,
                    filename:file.filename,
                    mimetype:file.mimetype,
                    path:`/uploads/${file.filename}`,
                },
            });
            }else{
                return res.status(400).json({
                    success:false,
                    message:"dont have permission to change the image",
                });
            }
        }
    }catch(err){
        throw err;
    }
}






//group id and sender id is it in this
//edit group Setting   can change group name,image in client side we will show
//two options or many check options 
export const groupPermission=async(data:
    {_id:string,
    senderId:string,
    changeNameSettings:boolean,
    changeImageSettings:boolean,
    changeAddGroupMembers:boolean,
    changeDisapperingMessageSetting:boolean,
    onlyAdminSendMessage:boolean,
})=>{
    try{
        const group=await groupChatModel.findById(data._id);
        if(!group){
            throw new Error("group not found");
        }
        const checkAdmin=group.admin.some(
            (id)=>id.toString()===data.senderId.toString()
        );
        if(checkAdmin){
            group.canChangeGroupName=data.changeNameSettings;
            group.canChangeGroupImage=data.changeImageSettings;
            group.canAddGroupMembers=data.changeAddGroupMembers;
            group.changeDisappearingMessageSetting=data.changeDisapperingMessageSetting;
            group.onlyAdminSendMessage=data.onlyAdminSendMessage;
            await group.save();
            return group;
        }else{
            throw new Error("dont have permission to change group setting");
        }
    }catch(err){
        throw err;
    }
}





//this will basically give us all the peoples in group
export const allMembersInGroup=async(data:{_id:string,senderId:string})=>{
    try{
        const group=await groupChatModel.findById(data._id);
        if(!group){
            throw new Error("something went wrong or group deleted");
        }
       await Promise.all([
        group.populate("peoplesId","name avatar"),
        group.populate("admin","name avatar")
       ]);
        return group;
    }catch(err){
        throw err;
    }
}











export const makeAdmin=async(data:{_id:string,senderId:string,receiverId:string})=>{
    try{
        if(!data._id || !data.senderId || !data.receiverId){
            throw new Error("group id is missing or Unauthorized login again");
        }
        const group=await groupChatModel.findById(data._id);
        if(!group){
            throw new Error("group not found");
        }
        const checkAdmin=group.admin.some(
            (id=>id.toString()===data.senderId.toString())
        );
        if(!checkAdmin){
            throw new Error("You don't have permission to make user admin");
        }else{
            const id=new mongoose.Types.ObjectId(data.senderId);
            const checkAlreadyPresent=group.admin.some(
                (id)=>id.toString()===data.senderId.toString()
            );
            if(checkAlreadyPresent){
                throw new Error("already an admin");
            }else{
                const id=new mongoose.Types.ObjectId(data.receiverId);
                group.admin.push(id);
                await group.save();
                await Promise.all([
                    group.populate("peoplesId","name avatar"),
                    group.populate("admin","name avatar") 
                ]);
                return group;
            }
        }
    }catch(err){
        throw err;
    }
} 





//here receiverId means the person we want to remove as admin
export const removeAdmin=async(data:{_id:string,senderId:string,receiverId:string})=>{
    try{
        const group=await groupChatModel.findById(data._id);
        if(!group){
            throw new Error("group not found");
        }
        const checkAdmin=group.admin.some(
            (id)=>id.toString()===data.senderId.toString()
        );
        if(!checkAdmin){
            throw new Error("cannot have access to remove admin");
        }else{
            group.admin=group.admin.filter(
                (id)=>id.toString()!==data.receiverId.toString()
            );
        }
        await group.save();
        await Promise.all([
              group.populate("peoplesId","name avatar"),
              group.populate("admin","name avatar") 
                ]);
        return group;
    }catch(err){
        throw err;
    }
}






//receiverId is person who we want to remove from group 
//senderId is person who wants to remove the person if he is admin
export const removePerson=async(data:{_id:string,senderId:string,receiverId:string})=>{
    try{
        const group=await groupChatModel.findById(data._id);
        if(!group){
            throw new Error("group not found");
        }
        const isAdmin=group.admin.some(
            (id)=>id.toString()===data.senderId.toString()
        );
        if(!isAdmin){
            throw new Error("don't have access to remove person from group");
        }
        group.peoplesId=group.peoplesId.filter(
            (id)=>id.toString()!==data.receiverId.toString()
        );
        const id=new mongoose.Types.ObjectId(data.receiverId);
        group.removedMembers.push(id);
        await group.save();
        await Promise.all([
             group.populate("peoplesId","name avatar"),
             group.populate("admin","name avatar") 
                ]);
        return group;
    }catch(err){
        throw err;
    }
}









export const personLeaveGroup=async(data:{_id:string,senderId:string})=>{
    try{
        const group=await groupChatModel.findById(data._id);
        if(!group){
            throw new Error("group not exist");
        }
        const findPerson=group.peoplesId.some(
        (id)=>id.toString()===data.senderId.toString()
        );
      if(!findPerson){
       throw new Error("you have already leave the group or there is some technical issue at our end");
      }
      const id=new mongoose.Types.ObjectId(data.senderId);
      group.removedMembers.push(id);
      group.peoplesId=group.peoplesId.filter(
        (id)=>id.toString()===data.senderId.toString()
      );
      await group.save();
      await Promise.all([
          group.populate("peoplesId","name avatar"),
          group.populate("admin","name avatar") 
                ]);
      return group;
    }catch(err){
        throw err;
    }
}



//senderId is person who will join the receiverPerson

//here we add normally direct



//here now be emit and store message like added by someone aesa implement karna ha ab

export const addMembers=async(data:{_id:string,senderId:string,receiverId:string})=>{
    try{
        const group=await groupChatModel.findById(data._id);
        if(!group){
            throw new Error("group not found");
        }
        if(group.canAddGroupMembers){
            //here check if person is on removedgroup array remove it from there
            group.removedMembers=group.removedMembers.filter(
                (id)=>id.toString()!==data.receiverId.toString()
            );
            const id=new mongoose.Types.ObjectId(data.receiverId);
            group.peoplesId.push(id);
            await group.save();
            await Promise.all([
                    group.populate("peoplesId","name avatar"),
                    group.populate("admin","name avatar") 
                ]);
            return group;
        }else{
            const isAdmin=group.admin.some(
                (id)=>id.toString()===data.senderId.toString()
            );
            if(!isAdmin){
                throw new Error("don't have access to add new members");
            }
            const id=new mongoose.Types.ObjectId(data.receiverId);
            group.peoplesId.push(id);
            await group.save();
            await Promise.all([
                    group.populate("peoplesId","name avatar"),
                    group.populate("admin","name avatar") 
                ]);
            return group;
        }
    }catch(err){
        throw err;
    }
}




//
// 1 generate a random qr link
// 2 make a link and npm install qrcode
// 3 create qr code basically link we have to create user scan that and in there in inviteLink
// 4 joingroup



export const createGroupQr=async(req:authRequest,res:Response,next:NextFunction)=>{
    try{
        const {id}=req.params;
        const group=await groupChatModel.findById({_id:id});
        if(!group){
            return res.status(400).json({
                success:false,
                message:"group not found",
            });
        }
        const inviteLink=group.inviteToken;
        const url=`http://localhost:5000/api/v1/group/join/${inviteLink}`;
       const qrCode=await QRCode.toDataURL(url);
       return res.status(200).json({
        success:true,
        message:"qr code generated successfully",
        qrCode,
       })
    }catch(err){
        console.log(err);
        throw err;
    }
}




//after this we will emit once more all particular member in group
//group/join/:inviteLink
export const joinGroup=async(req:authRequest,res:Response,next:NextFunction)=>{
    try{
        const {inviteLink}=req.params;
        const user=req.user;
        if(!inviteLink){
            return res.status(400).json({
                success:false,
                message:"qr scan failed",
            });
        }
        if(!user){
            return res.status(401).json({
                success:false,
                message:"Unauthorized",
            });
        }
        const group=await groupChatModel.findOne({inviteToken:inviteLink});
        if(!group){
            return res.status(404).json({
                success:false,
                message:"group not found",
            });
        }
        group.removedMembers=group.removedMembers.filter(
            (id)=>id.toString()!==user._id.toString()
        );
        const id=new mongoose.Types.ObjectId(user._id);
        group.peoplesId.push(id);
        await group.save();
        await Promise.all([
             group.populate("peoplesId","name avatar"),
             group.populate("admin","name avatar") 
                ]);
        //after return on frontend we again have to emit because this is response 
        // we again send group id to backend and io.emit to all the members of the group 
        // if they are online that new person join
        return res.status(200).json({
            success:true,
            group,
        })
    }catch(err){
        next(err);
    }
}












//in this we have to show user the groups in which user is actually involved
export const groups=async(data:{senderId:string})=>{
    try{
        const findAllGroups=await groupChatModel.find({peoplesId:data.senderId}).populate("peoplesId","name avatar");
        if(findAllGroups.length===0){
            return;
        }
        return findAllGroups;
    }catch(err){
        throw err;
    }
}