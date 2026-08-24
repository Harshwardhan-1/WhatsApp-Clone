import mongoose,{Document,Types} from 'mongoose';

export interface INotification extends Document{
    senderId:string,
    receiverId:string,
    duration:string,
    mutedUntil?:Date | null,
};


export const notificationSchema=new mongoose.Schema<INotification>({
    senderId:{
        type:String,
        required:[true,'senderId is missing'],
    },
    receiverId:{
        type:String,
        required:[true,'receiverId is missing'],
    },
    duration:{
        type:String,
        enum:["8hrs","1week","always","off"],
        default:"off",
    },
    mutedUntil:{
        type:Date,
        default:null,
    },
},{
    timestamps:true,
});


export const notification=mongoose.model<INotification>("notification",notificationSchema);










export interface IGroupNotification extends Document{
    groupId:string,
    senderId:string,
    duration:string,
    mutedUntil:Date | null,
}




const muteGroupNotification=new mongoose.Schema<IGroupNotification>({
    groupId:{
        type:String,
        required:[true,'groupId is required'],
    },
    senderId:{
        type:String,
        required:[true,'senderId is required'],
    },
    duration:{
        type:String,
        enum:["off","8hrs","1week","always"],
        default:"off",
    },
    mutedUntil:{
        type:Date,
        default:null,
    },
},
{timestamps:true}
);




export const muteGroupNotificationModel=mongoose.model("group_mute_notification",muteGroupNotification);