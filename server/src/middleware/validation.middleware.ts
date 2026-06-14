import {Request,Response,NextFunction} from 'express';
import z from 'zod';

export const validate=(schema:z.ZodObject<any>)=>(req:Request,res:Response,next:NextFunction):void=>{
    const result=schema.safeParse(req.body);
    if(!result.success){
        const issue=result.error.issues[0]
        res.status(400).json({
            success:false,
            error:issue,
        });
        return;
    }
    req.body=result.data;
    next();
}