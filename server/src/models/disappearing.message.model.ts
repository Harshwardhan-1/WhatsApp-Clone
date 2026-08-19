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








//this one is for group message Model foe disappearing message




export interface IDisappearingMessageModel extends Document{
    groupId:string,
    senderId:string,
    duration:string,
}





const groupDisappearingMessage=new mongoose.Schema<IDisappearingMessageModel>({
    groupId:{
        type:String,
        required:[true,'group id is required'],
    },
    senderId:{
        type:String,
        required:[true,'senderId is required'],
    },
    duration:{
        type:String,
        default:"off",
    },
},
{timestamps:true}
);


export const groupDisappearingMessageModel=
mongoose.model<IDisappearingMessageModel>("groupDisappeingMessage",groupDisappearingMessage)