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










export interface IGroupFavourites extends Document{
    groupId:Types.ObjectId, //group id
    senderId:Types.ObjectId,
    isMarkedAsFavourites:boolean,
}



const groupFavouritesSchema=new mongoose.Schema<IGroupFavourites>({
groupId:{
    type:mongoose.Schema.Types.ObjectId,
    required:[true,'group id is required'],
},
senderId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user",
    required:[true,'senderId is required'],
},
isMarkedAsFavourites:{
    type:Boolean,
    default:false,
}
},
{timestamps:true}
);




export const groupFavourites=mongoose.model<IGroupFavourites>("group_Favourites",groupFavouritesSchema);