import mongoose,{Document,Types} from 'mongoose';


interface react{
    userId:Types.ObjectId,
    emoji:string,
}

export interface IChannelMessage extends Document{
    channelId:Types.ObjectId,
    senderId:Types.ObjectId,
    message:string,
    messageType:string,
    orignalname?:string,
    mimetype?:string,

    isEdited?:boolean,

    hideIt:string[],
    reaction:react[],

    seenBy:Types.ObjectId[],

    expiresAt:Date,
}






const message=new mongoose.Schema<IChannelMessage>({
    channelId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"channels",
        required:[true,'channel id is required'],
    },
    senderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:[true,'senderId is required'],
    },
    message:{
        type:String,
        required:[true,'message field cannot empty'],
    },
    messageType:{
        type:String,
        enum:["text","file","system","poll"],
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
    isEdited:{
        type:Boolean,
        default:false,
    },
    hideIt:{
        type:[String],
        default:[],
    },
    reaction:[
        {
            userId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"user",
            },
            emoji:{
                type:String,
                default:"",
            },
        },
    ],
    seenBy:[
    {
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
    },
],
    expiresAt:{
        type:Date,
        required:[true,'expires At is missing'],
    },
},
{timestamps:true}
);



message.index({expiresAt:1},{expireAfterSeconds:0})




export const channelMessage=mongoose.model("channel_message",message);