import multer from 'multer';
import {Request,Response,NextFunction} from 'express';
import fs from 'fs';
import path from 'path';


const uploadDir=path.join(process.cwd(),"uploads");
if(!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir,{recursive:true});
}



const storage=multer.diskStorage({
    destination(_req,file,cb) {
      cb(null,uploadDir)
    },
    filename(_req,file,cb) {
    const ext=path.extname(file.originalname);
    const uniqueName=`${Date.now()}-${Math.round(Math.random()*1e9)}+${ext}`;
    cb(null,uniqueName);
    },
});


const fileFilter:multer.Options['fileFilter']=(_req,file,cb)=>{
    if(file.mimetype.startsWith("image/")){
        cb(null,true);
    }else{
        cb(new Error("only images are allowed as profile pic"));
    }
}


export const channelUploads=multer({
    storage,
    fileFilter,
    limits:{
        //max 50 mb
        fileSize:50*1024*1024
    },
});