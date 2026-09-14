import mongoose,{Document,Types} from 'mongoose';



export interface ICommunityMessage extends Document{
    communityId:Types.ObjectId,

    senderId:string,
    message:string,
    mimetype?:string,
    orignalname?:string,
    
    messageType:["text","file"],


    expiresAt:Date,
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
    enum:["text","file"],
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
},
{timestamps:true},
);




export const communityMsg=mongoose.model("communityMessageModel",communityMessage);