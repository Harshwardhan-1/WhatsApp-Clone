import mongoose,{Document,Types} from 'mongoose';


interface Reaction{
    userId:Types.ObjectId,
    emoji:string,
}

interface ParentReply{
    messageId:Types.ObjectId,
    userId:Types.ObjectId,
    message:string,
}

export interface IGroupMessage extends Document{
    
    groupId:Types.ObjectId,
    senderId:string,


    message:string,


    parentReply:ParentReply[],

    messageType:string,


    fileUrl?:string,
    filename?:string,
    orignalname?:string,
    mimetype?:string,   
    sizeInKb?:number,
    sizeInMb?:number,


    isSend:boolean,
    isDelivered:boolean,
    isSeen:boolean,
    isPinned?:boolean,
    isEdited:boolean,

    deliveredTo:Types.ObjectId[],
    seenBy:Types.ObjectId[],
    hideIt:string[],
    isClear:string[],


    
    expiresAt?:Date | null,
    notificationSound?:string,
  

    reaction:Reaction[],
}






const groupChatSchema=new mongoose.Schema<IGroupMessage>({
    groupId:{
        type:mongoose.Schema.Types.ObjectId,
        required:[true,'groupId is required'],
        index:true,
    },
    senderId:{
        type:String,
        required:[true,'senderId is missing'],
    },
    message:{
        type:String,
        required:[true,'message is missing'],
        minLength:[1,'message field should not be empty'],
    },
    parentReply:[
        {
            messageId:{
                type:Types.ObjectId,
                ref:"group_message",
            },
            userId:{
                type:Types.ObjectId,
                ref:"user",
            },
            message:{
                type:String,
            },
        default:[],
        },
    ],
    messageType:{
        type:String,
        enum:["text","file","system"],
        required:[true,'message type is missing'],
    },
    fileUrl:{
        type:String,
        default:"",
    },
    filename:{
        type:String,
        default:"",
    },
    orignalname:{
        type:String,
        default:"",
    },
    mimetype:{
        type:String,
        default:"",
    },
    sizeInKb:{
        type:Number,
        default:0
    },
    sizeInMb:{
        type:Number,
        default:0,
    },
    isPinned:{
        type:Boolean,
        default:false,
    },
    isEdited:{
        type:Boolean,
        default:false,
    },
    isSend:{
        type:Boolean,
        default:false,
    },
    isDelivered:{
        type:Boolean,
        default:false,
    },
    isSeen:{
        type:Boolean,
        default:false,
    },
     deliveredTo:[
        {
        type:Types.ObjectId,
        ref:"user",
        },
    ],
    seenBy:[
        {
        type:Types.ObjectId,
        ref:"user",
        },
    ],

    hideIt:{
            type:[String],
            default:[],
        },
    isClear:{
            type:[String],
            default:[],
        },
    expiresAt:{
        type:Date,
        default:null,
    },
    notificationSound:{
        type:String,
        default:"off",
    },
    reaction:[
        {
            userId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"user"
            },
            emoji:{
                type:String,
                default:"",
            },
        },
    ],
},
{timestamps:true}
);




groupChatSchema.index({expiresAt:1},{expireAfterSeconds:0});

export const groupMessage=mongoose.model<IGroupMessage>("group__messages",groupChatSchema);