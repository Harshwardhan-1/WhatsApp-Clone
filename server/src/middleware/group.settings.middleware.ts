import {Request,Response,NextFunction} from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';


const uploadDir=path.join(process.cwd(),"uploads");
if(!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}


const storage=multer.diskStorage({
    destination:(_req,file,cb)=>{
        cb(null,uploadDir);
    },
    filename(_req,file,cb) {
        const ext=path.extname(file.originalname);
        const uniqueName=`${Date.now()}-${Math.round(Math.random()*1e9)+ext}`;
        cb(null,uniqueName);
    },
});


const fileFilter:multer.Options['fileFilter']=(_req,file,cb)=>{
    if(file.mimetype.startsWith("image/")){
        cb(null,true);
    }else{
        cb(new Error("this file format is not supported"));
    }
}

export const profileSettings=multer({
    fileFilter,
    storage,
    limits:{
        fileSize:50*1024*1024,
    },
});