import mongoose,{Document,Types} from 'mongoose';

export interface Idisappaering extends Document{
    senderId:string,
    receiverId:string,
    duration:string,
};


const disappearingSchema=new mongoose.Schema<Idisappaering>({
    senderId:{
        type:String,
        required:[true,'senderId is missing'],
    },
    receiverId:{
        type:String,
        required:[true,'receiverId is missing'],
    },
    duration:{
        type:String,
        enum:["off","24hrs","7days","90days"],
        default:"off",
    } 
},
{timestamps:true}

);

export const disappearingModel=mongoose.model<Idisappaering>("disappering",disappearingSchema);