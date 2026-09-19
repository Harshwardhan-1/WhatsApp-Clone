import mongoose,{Document,Types} from 'mongoose';

interface reaction{
    _id?:Types.ObjectId,
    userId:Types.ObjectId,
    emoji:string,
}

interface parent{
    //parent id is the message at which user react or give response 
    parentId:Types.ObjectId,
    message:string,
    senderId:string,
}


export interface ICallChat extends Document{
    callId:string,
    groupId:string,
    message:string,


    senderId:Types.ObjectId,
    parentReply:parent[],
    viewedBy:Types.ObjectId[],
    toggleLike:Types.ObjectId[],



    isEdited?:boolean,

    reaction:reaction[],
    // expiresAt:Date,
}











const callChatSchema=new mongoose.Schema<ICallChat>({
    callId:{
        type:String,
        required:[true,'callId is required'],
    },
    groupId:{
        type:String,
        required:[true,'groupId is required'],
    },
     message:{
        type:String,
        required:[true,'message field is required'],
        trim:true,
        minLength:[1,'message field cannot be empty'],
     },
    senderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:[true,'senderId is required'],
    },
    parentReply:[
        {
            parentId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"group__messages",
            },
            message:{
                type:String,
            },
            senderId:{
                type:String,  
            },
        },
    ],
    toggleLike:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"user",
        },
    ],
    viewedBy:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"user",
        },
    ],
    isEdited:{
        type:Boolean,
        default:false,
    },
    reaction:[
        {
            userId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"user",
            },
            emoji:{
                type:String,
            },
        },
    ],
    // expiresAt:{
    //     type:Date,
    //     defaut:new Date(Date.now()+24*60*60*1000)
    // },
});









export const callChat=mongoose.model<ICallChat>("inCallChat",callChatSchema);