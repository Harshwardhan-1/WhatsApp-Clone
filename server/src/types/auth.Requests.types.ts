import {Request,Response} from 'express';
import { IUser } from "../models/user.model";
import { JwtPayload } from "jsonwebtoken";

export interface userpayload extends JwtPayload{
    id:string,
    email:string,
}


export interface authRequest extends Request{
    user?:IUser | null
}