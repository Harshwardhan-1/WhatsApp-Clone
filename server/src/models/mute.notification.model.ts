import mongoose,{Document,Types} from 'mongoose';

export interface INotification extends Document{
    senderId:string,
    receiverId:string,
    duration:string,
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
},{
    timestamps:true,
});


export const notification=mongoose.model<INotification>("notification",notificationSchema);