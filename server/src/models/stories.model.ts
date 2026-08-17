import mongoose,{Document,Types} from 'mongoose';


interface Reply{
    userId:Types.ObjectId,
    message:string,
    replyTo:Types.ObjectId | null,
    likes:Types.ObjectId[],
}

export interface IShortWhatsAppStories extends Document{
    senderId:string,
    // is this storylink basically there is path where video are stored or images
    storyLink:string,
    storyType:"image" | "video",
    message?:string,
    createdBy:Types.ObjectId,
    likes:Types.ObjectId[],
    viewedBy:Types.ObjectId[],
    replyBy:Reply[],
    expiresAt:Date,
    createdAt:Date, 
    updatedAt:Date,
};



const storiesSchema=new mongoose.Schema<IShortWhatsAppStories>({
    senderId:{
        type:String,
        required:[true,'senderId is required'],
    },
    storyLink:{
        type:String,
        required:[true,'storyLink is missing'],
    },
    storyType:{
        type:String,
        enum:["image","video"],
        required:[true,'supports only images and video'],
    },
    message:{
        type:String,
        default:"",
    },
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        //basically it is sender id only which is help to 
        required:[true,'userId is missing'],
        ref:"user",
    },
    likes:[
        {
                type:mongoose.Schema.Types.ObjectId,
                ref:"user",
                default:[],
        },
    ],
    viewedBy:[
        {
                type:mongoose.Schema.Types.ObjectId,
                ref:"user",
                default:[],
        },
    ],
    replyBy:[
        {
            userId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"user",
            },
            message:{
                type:String,
                default:"",
            },
            replyTo:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"user",
                default:null,
            },
            likes:[
                {
                type:mongoose.Schema.Types.ObjectId,
                default:[],
            },
         ],
        }
    ],
    expiresAt:{
        type:Date,
        default:null,
    },
},
{timestamps:true}
);


storiesSchema.index({expiresAt:1},{expireAfterSeconds:0});



export const stories=mongoose.model<IShortWhatsAppStories>("stories",storiesSchema);