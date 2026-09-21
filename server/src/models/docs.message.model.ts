import mongoose,{Document,Types} from 'mongoose';

interface reply{
    //the message at which user reply it is this id
    parentId:Types.ObjectId,
    senderId:Types.ObjectId,
    message:string,
}


interface reaction{
    _id?:Types.ObjectId,
    userId:Types.ObjectId,
    emoji:string,
}

//adds extra field like populate save()
export interface IDocsMessage extends Document{
    docsId:Types.ObjectId,
    message:string,

    senderId:Types.ObjectId,
    viewedBy:Types.ObjectId[],
    toggleLike:Types.ObjectId[],
    reply:reply[],

    isEdited?:boolean,

    reaction:reaction[],
}








const docsMessageSchema=new mongoose.Schema<IDocsMessage>({
    docsId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"docs",
        required:[true,'docs id is required'],
    },
    senderId:{
        type:mongoose.Schema.Types.ObjectId,
        required:[true,'senderId is required'],
        ref:"user",
    },
    message:{
        type:String,
        trim:true,
        required:[true,'message field cannot be empty'],
        minLength:[1,'message field should have atleast one character'],
    },
    viewedBy:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"user",
        },
    ],
    toggleLike:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"user",
        },
    ],
    reply:[
        {
            parentId:{
                type:mongoose.Schema.Types.ObjectId,
            },
            senderId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"user",
            },
            message:{
                type:String,
            },
        },
    ],
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
},
{timestamps:true}
);









export const docsMessage=mongoose.model<IDocsMessage>("docsMessage",docsMessageSchema);