import mongoose,{Document,Types} from 'mongoose';


export interface IShortWhatsAppStories extends Document{
    senderId:string,
    // is this storylink basically there is path where video are stored or images
    storyLink:string,
    storyType:"image" | "video",
    msg:string,
    likes:Types.ObjectId[],
    viewedBy:Types.ObjectId[],
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
    likes:[
        {
            userId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"user",
            }
        },
    ],
    viewedBy:[
        {
            userId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"user",
            }
        },
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