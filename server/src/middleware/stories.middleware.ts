import multer from 'multer';
import path from 'path';
import fs from 'fs';

const supportedMimetype=[
    "image/",
    "video/"
]

const uploadDir=path.join(process.cwd(),"uploads");
if(!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir,{recursive:true});
}

const storage=multer.diskStorage({
    destination:(_req,res,cb)=>{
        cb(null,uploadDir);
    },
    filename(req, file, cb) {
        const ext=path.extname(file.originalname);
        const uniqueName=`${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`;
        cb(null,uniqueName);
    },
});

    const fileFilter:multer.Options['fileFilter']=(_req,file,cb)=>{
        if(supportedMimetype.some(type=>file.mimetype.startsWith(type))){
            cb(null,true);
        }else{
        cb(new Error("this file format is not supported for stories"));
    }
}

export const storiesUpload=multer({
storage,
fileFilter,
limits:{
    fileSize:50*1024*1024,
}
});