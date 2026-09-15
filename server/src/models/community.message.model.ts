import mongoose,{Document,Types} from 'mongoose';



interface reaction{
    userId:Types.ObjectId,
    emoji:string,
}

export interface ICommunityMessage extends Document{
    communityId:Types.ObjectId,

    senderId:string,
    message:string,
    mimetype?:string,
    orignalname?:string,
    messageType:string,

    isEdited?:boolean,


    expiresAt:Date,

    reaction:reaction[],
}



const communityMessage=new mongoose.Schema({
   communityId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"community",
    required:[true,'communityId is required'],
   },
   senderId:{
    type:String,
    required:[true,'senderId is required'],
   },
   message:{
    type:String,
    required:[true,'message field is required'],
    trim:true,
    minLength:[1,'message field cannot be empty'],
   },
   messageType:{
    type:String,
    enum:["text","file","system"],
    default:"text",
   },
   mimetype:{
    type:String,
    default:"",
   },
   orignalname:{
    type:String,
    default:"",
   },
   expiresAt:{
    type:Date,
    default:new Date(Date.now()+24*60*60*1000),
   },
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
},
{timestamps:true},
);




export const communityMsg=mongoose.model("communityMessageModel",communityMessage);



communityMessage.index({expiresAt:1},{expireAfterSeconds:0});