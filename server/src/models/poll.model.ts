import mongoose,{Document,Types} from 'mongoose';

interface optionsConfig{
    _id:Types.ObjectId,
    msg:string,
    peoplesId:Types.ObjectId[],
}
export interface IPollInterface extends Document{
    channelId?:Types.ObjectId,
    title:string,
    senderId:string,
    canSelectMultiple:boolean,

   options:optionsConfig[],
}



const pollSchema=new mongoose.Schema<IPollInterface>({
    channelId:{
        type:mongoose.SchemaTypes.ObjectId,
        ref:"channels",
    },
    title:{
        type:String,
        required:[true,'title is missing for pole'],
    },
    senderId:{
        type:String,
        required:[true,'senderId is required'],
    },
    canSelectMultiple:{
        type:Boolean,
        default:false,
    },
    options:[
        {
            msg:{
                type:String,
                required:[true,'message is required'],
            },
            peoplesId:[
                {
                type:mongoose.Schema.Types.ObjectId,
                ref:"user",
            },
        ],
        default:[],
        },
    ],
},
{timestamps:true},
);





export const pollModel=mongoose.model<IPollInterface>("poll",pollSchema);