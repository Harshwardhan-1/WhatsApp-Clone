import mongoose,{Document,Types} from 'mongoose';


export interface IChannelChatlist extends Document{
    channelId:Types.ObjectId,
    senderId:Types.ObjectId,
    msgId:string,
    message:string,
    messageType:string,
    orignalname?:string,
    mimetype?:string,
}



const chatlistSchema=new mongoose.Schema<IChannelChatlist>({
    channelId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"channels",
        required:[true,'channelId is required'],
    },
    senderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:[true,'senderId is missing'],
    },
    msgId:{
        type:String,
        required:[true,'messageId is required'],
    },
    message:{
        type:String,
        required:[true,'message is required'],
    },
    messageType:{
        type:String,
        enum:["text","file","system"],
        default:"text",
    },
    orignalname:{
        type:String,
        default:"",
    },
    mimetype:{
        type:String,
        default:"",
    },
},

{timestamps:true}
);




export const channelLastMessage=mongoose.model<IChannelChatlist>("channelChatlist",chatlistSchema);