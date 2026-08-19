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
    
    groupId:string,
    senderId:string,
    receiverId:Types.ObjectId[],

    message:string,


    parentReply?:ParentReply[],

    messageType:"text" | "file" | "system",


    fileUrl?:string,
    filename?:string,
    orignalname?:string,
    mimetype?:string,   
    sizeInKb?:number,
    sizeInMb?:number,


    
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
        type:String,
        required:[true,'groupId is required'],
        index:true,
    },
    senderId:{
        type:String,
        required:[true,'senderId is missing'],
    },
    receiverId:[
        {
            type:Types.ObjectId,
            ref:"user",
            default:[],
        },
    ],
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
            }
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


export const groupMessage=mongoose.model<IGroupMessage>("group_message",groupChatSchema);