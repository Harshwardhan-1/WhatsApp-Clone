import mongoose,{Document,Types} from 'mongoose';



interface location{
    type:String,
    coordinates:number[],
}

export interface ICommunity extends Document{
    creatorId:Types.ObjectId,
    communityName:string,
    searchRadius?:string,

    location:location,


    members:Types.ObjectId[],
    
    expiresAt:Date,
}




const communitySchema=new mongoose.Schema<ICommunity>({
    creatorId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:[true,'creatorId is missing'],
    },
    communityName:{
        type:String,
        required:[true,'community name is required'],
        minLength:[3,'name must be atleast of 3 characters'],
        maxLength:[50,'name cannot excced more than 50 characters'],
    },
    searchRadius:{
        type:String,
        enum:["5km","10km","15km","20km","30km"],
        default:"5km"
    },
    location:{
        type:{
            type:String,
            enum:["Point"],
            default:"Point",
        },
        coordinates:{
            type:[Number],
            required:[true,'coordinates are required'],
        },
    },
    members:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"user",
        },
    ],
    expiresAt:{
        type:Date,
        default:()=>new Date(Date.now()+24*60*60*1000),
    },
},{
    timestamps:true,
});




export const community=mongoose.model<ICommunity>("community",communitySchema);




communitySchema.index({expiresAt:1},{expireAfterSeconds:0});
communitySchema.index({location:"2dsphere"});