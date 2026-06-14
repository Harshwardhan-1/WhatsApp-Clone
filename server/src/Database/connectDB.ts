    import mongoose from 'mongoose';
    export const connectDb=async()=>{
        try{
            await mongoose.connect(process.env.MONGO_URI as string);
            console.log("mongoDb connected");
        }catch(err){
            console.log("error in connecting",err);
            process.exit(1);
        }
    }