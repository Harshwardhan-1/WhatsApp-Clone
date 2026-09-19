import mongoose from 'mongoose';
import { Document,Types } from 'mongoose';
export interface IUser extends Document{
    _id:Types.ObjectId,
    name:string,
    email:string,
    password?:string,
    role:string,
    googleId?:string,
    avatar?:string,
    createdAt:Date,
    updatedAt:Date,
}

const userSchema=new mongoose.Schema<IUser>({
    name:{
        type:String,
        required:[true,'name is required'],
        minLength:[3,'name must be atleast 3 characters'],
        maxLength:[50,'name must be smaller than 50 characters'],
    },
    email:{
        type:String,
        required:[true,'email is required'],
        unique:[true,'already exist'],
        lowerCase:true,
        match : [/\S+@\S+\.\S+/, 'Please fill a valid email address'],
        index:true,
    },
    password:{
        type:String,
        // required:[true,'password is required'],

        //we make it false because for user login with google for that
        required:false,
        minLength:[3,'password must be greter than equals to 3'],
    },
    googleId:{
        type:String,
        unique:true,
        //sparse true because for empty ones mongo db tell it is duplicate don;t consider
        //them in unique if they dont have any googleId
        sparse:true,
        index:true,
    },
    role:{
        type:String,
        default:"user",
    },
    avatar:{
        type:String,
        default:"",
    },
},
{timestamps:true},
)


export const User=mongoose.model<IUser>("user",userSchema);