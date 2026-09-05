import mongoose,{Document,Types} from 'mongoose';

export interface IChannels extends Document{
    name:string,
    channelCreator:Types.ObjectId,
    description?:string,
    profilePic:string,
    followers:Types.ObjectId[],
    admin:Types.ObjectId[],
    category:string,
    hideIt:Types.ObjectId[],
    muteNotification:Types.ObjectId[],
};







const channelsSchema=new mongoose.Schema<IChannels>({
    name:{
        type:String,
        required:[true,'channel name is required'],
        minLength:[3,'channel name must be atleast 3 characters'],
        maxLength:[100,'channel name cannot be greater than 100 characters'],
    },
    channelCreator:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:[true,'channel creator id is missing'],
    },
    description:{
        type:String,
        minLength:[10,'description must be atleast 10 charcters'],
        maxLength:[100,'description cannot be greater than 100 characters'],
    },
    profilePic:{
        type:String,
        default:"/default.webp",
    },
    followers:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"user",
            default:[],
        },
    ],
    admin:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"user",
            default:[],
        }
    ],
    category:{
            type:String,
            enum:["sports","entertainment","technology","news","education","business","other"],
            default:"other",
        },
    hideIt:[
        {
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        },
    ],
    muteNotification:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"user",
        },
    ],
},
{timestamps:true},
);






export const channels=mongoose.model<IChannels>("channels",channelsSchema);