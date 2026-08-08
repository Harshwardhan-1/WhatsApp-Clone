import {Request,Response,NextFunction} from 'express';



export const fileupload=async(req:Request,res:Response,next:NextFunction)=>{
    try{
        const file=req?.file;
        if(!file){
            return res.status(400).json({
                success:false,
                message:"file is missing",
            });
        }
        console.log(req.file);
        const sizeInKb=Number(file.size/1024).toFixed(2);
        const sizeInMb=Number(file.size/1024*1024).toFixed(2);
        return res.status(200).json({
            success:true,
            message:"file uploaded successfully",
            data:{
                path:`/uploads/${file.filename}`,
                mimetype:file.mimetype,
                name:file.originalname,
                sizeInKb:sizeInKb,
                sizeInMb:sizeInMb,
                originalname:file?.originalname,
            }
        });
    }catch(err){
        next(err);
    }
}