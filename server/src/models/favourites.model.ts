import mongoose,{Document,Types} from 'mongoose';

export interface IFavourites extends Document{
    senderId:string,
    receiverId:string,
    IsMarkedAsFavourites:boolean,
}


const favouritesSchema=new mongoose.Schema<IFavourites>({
    senderId:{
        type:String,
        required:[true,'senderId is missing'],
    },
    receiverId:{
        type:String,
        required:[true,'receiverId is missing'],
    },
    IsMarkedAsFavourites:{
        type:Boolean,
        default:false,  
    },
},
{timestamps:true},
);



export const favourites=mongoose.model<IFavourites>("favourites",favouritesSchema);