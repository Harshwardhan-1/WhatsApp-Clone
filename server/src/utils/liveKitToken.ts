import { AccessToken } from "livekit-server-sdk";
import { LIVEKIT_API_KEY } from "../configs/env.config";
import { LIVEKIT_API_SECRET } from "../configs/env.config";

export const createLiveKitToken=async(userId:string,roomName:string)=>{
    const token=new AccessToken(
        LIVEKIT_API_KEY,
        LIVEKIT_API_SECRET,
        {identity:userId,}
    );
    token.addGrant({
        roomJoin:true,
        room:roomName,
        canPublish:true,
        canSubscribe:true,
    });
    return await token.toJwt();
};