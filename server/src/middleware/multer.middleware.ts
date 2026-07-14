import {Request,Response,NextFunction} from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { mime } from 'zod';


const uploaddir=path.join(process.cwd(),"uploads");
if(!fs.existsSync(uploaddir)){
    fs.mkdirSync(uploaddir,{recursive:true});
}



//_req means we find this parametre but it has no use here
const storage=multer.diskStorage({
    destination:(_req,file,cb)=>{
        cb(null,uploaddir);
    },
    filename:(_req,file,cb)=>{
        const uniqueName=`${Date.now()}+'-'+${Math.round(Math.random()*1e9)}+${path.extname(file.originalname)}`;
        cb(null,uniqueName);
    }
})


//fileFilter give the type to us 
const fileFilter:multer.Options['fileFilter']=(_req,file,cb)=>{
    cb(null,true);
}



//max 50 mb not more than 50 mb
export const upload=multer({
    storage,
    fileFilter,
    limits:{
        fileSize:50*1024*1024
    },
})