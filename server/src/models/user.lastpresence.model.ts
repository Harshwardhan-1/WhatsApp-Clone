import mongoose from 'mongoose';
import { Document,Types } from 'mongoose';

export interface IPresence extends Document{
    userId:string,
    Date:Date,
}

const userlastvisit=new mongoose.Schema<IPresence>({
    userId:{
        type:String,
        required:[true,'something is missing'],
    },
    Date:{
        type:Date,
    },
},{timestamps:true});


export const userlastpresence=mongoose.model<IPresence>("userpresence",userlastvisit);