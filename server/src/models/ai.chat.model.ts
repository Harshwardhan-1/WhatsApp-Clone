import mongoose,{Document,Types} from 'mongoose';




export interface IAIChat extends Document{
    senderId:Types.ObjectId,
    chatId:Types.ObjectId,
   
   
    role:string,
    message:string,
    emoji?:string,
    
}




const chat=new mongoose.Schema<IAIChat>({
    senderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:[true,'senderId is required'],
    },
    chatId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"aiChatList",
        required:[true,'chatId is required'],
    },
    message:{
        type:String,
        trim:true,
        required:[true,'message field is required'],
        minLength:[1,'message should be atleast consist of 1 character'],
    },
    role:{
        type:String,
        enum:["user","ai"],
        default:"user",
    },
    emoji:{
        type:String,  
        default:"",  
    },
},
{timestamps:true}
)



export const aiChat=mongoose.model<IAIChat>("ai_chat",chat);








export interface aiChatList extends Document{
    _id:Types.ObjectId,
    userId:Types.ObjectId,
    message:string,
}


const chatlist=new mongoose.Schema<aiChatList>({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        required:[true,'userId is required'],
    },
    message:{
        type:String,
        required:[true,'chatlist message is required'],
    },
},{timestamps:true});



 
export const aiChatList=mongoose.model<aiChatList>("aiChatList",chatlist);