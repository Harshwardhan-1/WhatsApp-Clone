import app from "./app";
import { PORT } from "./configs/env.config";
import { connectDb } from "./Database/connectDB";

const server=()=>{
    app.listen(PORT,async()=>{
        console.log(`Server is listening to http://localhost:${PORT}`)
        await connectDb();
    });
}