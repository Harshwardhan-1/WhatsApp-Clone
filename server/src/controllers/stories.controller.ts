import type {
createStoryConfig,
deleteStoryConfig,
toggleLikeConfig,
viewedByConfig,
addReplyConfig
} from "../configs/stories.config"

import {Request,Response,NextFunction} from 'express';
import { stories } from "../models/stories.model";
import mongoose from 'mongoose';



export const createStory=async(data:createStoryConfig)=>{
try{
    const exp=new Date(Date.now()+24*60*60*1000);
    const id=new mongoose.Types.ObjectId(data.senderId);
    const create=await stories.create({
        senderId:data.senderId,
        storyLink:data.link,
        message:data.message,
        storyType:data.storyType,
        createdBy:id,
        expiresAt:exp,
    });
    if(!create){
        throw new Error("failed to create statis");
    }
    return create;
}catch(err){
    throw err;
}
}



export const deleteStory=async(data:deleteStoryConfig)=>{
try{
const findStory=await stories.findById(data._id);
if(!findStory){
    throw new Error("status not found or deleted");
}
if(findStory.senderId!==data.senderId){
    throw new Error("you don't have access to delete this story");
}
const now=Date.now();
if(findStory.expiresAt.getTime()<now){
    throw new Error("story is already deleted or not found");
}
await findStory.deleteOne();
}catch(err){
    throw err;
}
}



export const toggleLike=async(data:toggleLikeConfig)=>{
try{
    const findStory=await stories.findById(data._id);
    if(!findStory){
        throw new Error("status not found");
    }
    const now=Date.now();
    if(findStory.expiresAt.getTime()<now){
        throw new Error("status not available");
    }
    const alreadyLike=findStory.likes.some(
        (id)=>id.toString()===data.senderId.toString()
    );
    if(alreadyLike){
        findStory.likes=findStory.likes.filter(
            (id)=>id.toString()!==data.senderId.toString()
        );
    }else{
        const id=new mongoose.Types.ObjectId(data.senderId);
        findStory.likes.push(id);
    }
    await findStory.save();
    const totalLikes=findStory.likes.length;
    return {findStory,totalLikes};
}catch(err){
    throw err;
}
}



export const viewedBy=async(data:viewedByConfig)=>{
    try{
        const findStory=await stories.findById(data._id).populate("viewedBy","name avatar")
        if(!findStory){
            throw new Error("status not found");
        }
        if(findStory.senderId!==data.senderId){
            throw new Error("you don't have permission to view this");
        }
        if(findStory.expiresAt.getTime()<Date.now()){
            throw new Error("story no longer exist");
        }
         return findStory.viewedBy;
    }catch(err){
        throw err;
    }
}



export const addReply=async(data:addReplyConfig)=>{
try{
    const findStory=await stories.findById(data._id);
    if(!findStory){
        throw new Error("status not found");
    }
    if(findStory.expiresAt.getTime()<Date.now()){
        throw new Error("cannot reply to this story as it is no longer available");
    }
    const id=new mongoose.Types.ObjectId(data.senderId);

    if(!data.parentId){
        findStory.replyBy.push({userId:id,message:data.message,replyTo:null,likes:[]});
    }else{
        const parentReply=findStory.replyBy.find(
            (reply)=>(reply as any)._id?.toString()===data.parentId?.toString()
        );
        if(!parentReply){
            throw new Error("reply not exist or story unavailable");
        }
        findStory.replyBy.push({
            userId:id,
            message:data.message,
            replyTo:(parentReply as any)._id,
            likes:[],
        });
    }
    await findStory.save();
    await findStory.populate("replyBy.userId","name avatar")
    return findStory.replyBy;
}catch(err){
    throw err;
}
}



export const deleteReply=async(data:{_id:string,replyId:string,senderId:string})=>{
    try{
//_id is the story id
     const findStory=await stories.findById(data._id);
     if(!findStory){
        throw new Error("status not found");
     }
     if(findStory.expiresAt.getTime()<Date.now()){
        throw new Error("status not availbale");
     }
     
     const findReplyId=findStory.replyBy.find(
        (reply)=>(reply as any)?._id.toString()===data.replyId.toString()
     );
     if(!findReplyId || (findReplyId as any).userId.toString()!==data.senderId.toString()){
        throw new Error("reply not found or you dont have access to delete this reply");
     }
     findStory.replyBy=findStory.replyBy.filter(
        (reply)=>(reply as any)?._id.toString()!==data.replyId.toString()
     ) as any;
     await findStory.save();
     await findStory.populate("replyBy.userId","name avatar");
     return findStory.replyBy;
    }catch(err){
        throw err;
    }
}



export const toggleLikeOnReply=async(data:{_id:string,replyId:string,senderId:string})=>{
    try{
        const story=await stories.findById(data._id);
        if(!story){
            throw new Error("status not available");
        }
        if(story.expiresAt.getTime()<Date.now()){
            throw new Error("status not available or it has been deleted");
        }
        const checkReplyExist=story.replyBy.find(
            (reply)=>(reply as any)._id.toString()===data.replyId.toString()
        );
        if(!checkReplyExist){
            throw new Error("reply not found");
        }
        const checkAlreadyLike=checkReplyExist.likes.some(
        (id)=>id.toString()===data.senderId.toString()
        );
        if(checkAlreadyLike){
            checkReplyExist.likes=checkReplyExist.likes.filter(
              (id)=>id.toString()!==data.senderId.toString()
            );
        }else{
            const id=new mongoose.Types.ObjectId(data.senderId);
            checkReplyExist.likes.push(id);
        }
        await story.save();
        await story.populate("replyBy.userId","name avatar");
        return {replyBy:story.replyBy,likes:checkReplyExist.likes.length};
    }catch(err){
        throw err;
    }
}




export const showAllReplies=async(data:{_id:string,senderId:string})=>{
    try{
        const findStory=await stories.findById(data._id).populate("replyBy.userId","name avatar");
        if(!findStory){
            throw new Error("story not found");
        }
        if(findStory.expiresAt.getTime()<Date.now()){
            throw new Error("story is deleted");
        }
        return findStory.replyBy;
    }catch(err){
        throw err;
    }
}



//all stories of particular user
export const allStoriesOfParticularUser=async(data:{receiverId:string})=>{
    try{
        if(!data.receiverId){
            throw new Error("receiverId is missing");
        }
        const findAllStory=await stories.find({senderId:data.receiverId,expiresAt:{$gt:new Date()}})
        .populate("createdBy","name avatar").sort({createdAt:1});
        if(findAllStory.length===0){
            return;
        }
        return findAllStory;
    }catch(err){
        throw err;
    }
}



export const showAllStories=async()=>{
    try{
        const status=await stories.find(
        {expiresAt:{$gt:new Date()}})
        .populate("createdBy","name avatar")
        .sort({createdAt:-1});

        if(status.length===0){
            return;
        }

        return status;
    }catch(err){
        throw err;
    }
}



//here we will show check what to mark green and white circle on the stories
//id is story id
export const checkMark=async(data:{_id:string,senderId:string})=>{
    try{
        const status=await stories.findById(data._id);
        if(!status){
            return;
        }
        if(status.expiresAt.getTime()<Date.now()){
            return;
        }
        const check=status.viewedBy.some(
            (id)=>id.toString()===data.senderId.toString()
        );
        if(check){
            return {senderId:data.senderId,viewed:"viewed"};
        }else{
            return {senderId:data.senderId,viewed:"not viewed"};
        }
    }catch(err){
        throw err;
    }
}


interface markAsViewedConfig{
     senderId:string,
    _id:string,
}

export const markAsViewed=async(data:markAsViewedConfig)=>{
    try{
        const findStory=await stories.findById(data._id);
        if(!findStory){
            throw new Error("status not found");
        }
        if(findStory.expiresAt.getTime()<Date.now()){
            throw new Error("story no longer available");
        }
        if(findStory.senderId===data.senderId){
            return findStory;
        }
        const alreadyViewed=findStory.viewedBy.some(
            (id)=>id.toString()===data.senderId.toString()
        );
        if(!alreadyViewed){
            const id=new mongoose.Types.ObjectId(data.senderId);
            findStory.viewedBy.push(id);
            await findStory.save();
        }
        return findStory;
    }catch(err){
        throw err;
    }
}



export const uploadStoryInformation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const file = req?.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "file not found",
      });
    }

    const storyType: "image" | "video" = file.mimetype.startsWith("video/")
      ? "video"
      : "image";

    return res.status(200).json({
      success: true,
      message: "file uploaded successfully",
      data: {
        path: `/uploads/${file.filename}`,
        mimetype: file.mimetype,
        filename: file.filename,
        originalname: file.originalname,
        storyType,
        sizeInKb: (file.size / 1024).toFixed(2),
        sizeInMb: (file.size / (1024 * 1024)).toFixed(2),
      },
    });
  } catch (err) {
    next(err);
  }
};