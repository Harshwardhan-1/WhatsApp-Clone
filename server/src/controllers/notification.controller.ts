import { notification } from "../models/mute.notification.model";


export const changeNotificationSetting=async(data:{senderId:string,receiverId:string,duration:string})=>{
    try{
        const findUser=await notification.findOne({senderId:data.senderId,receiverId:data.receiverId});
        if(findUser){
            findUser.duration=data.duration;
            await findUser.save();
            return;
        }
        const create=await notification.create({
            senderId:data.senderId,
            receiverId:data.receiverId,
            duration:data.duration,
        });
        if(!create){
            throw new Error("failed to save your prefrence for notification");
        }
    }catch(err){
        throw new Error("failed to save notification");
    }
}





export const prev_mark_notification=async(data:{senderId:string,receiverId:string})=>{
    try{
        const findDuration=await notification.findOne({
            senderId:data.senderId,
            receiverId:data.receiverId,
        });
        if(findDuration){
            return findDuration.duration;
        }
    }catch(err){
        throw new Error("failed to get previous marked notification");
    }
}