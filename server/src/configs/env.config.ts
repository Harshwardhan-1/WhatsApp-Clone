import dotenv from 'dotenv';
dotenv.config({path:`.env.${process.env.NODE_ENV || 'devlopment'}.local`});

export const{
    MONGO_URI,
    FRONTEND_URL,
    JWT_SECRET,
    SALT_ROUND,
    PORT,
}=process.env