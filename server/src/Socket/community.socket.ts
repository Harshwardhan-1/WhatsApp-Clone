import {Socket,Server} from 'socket.io';
import {
    createCommunity,
    allUserCommunity,
    deleteCommunity,
    editCommunityName,
    editCommunityImage,
    editSearchRadius,
    userJoinCommunity,
    userLeaveCommunity,
    communityData,
    showNearBy,
} from '../controllers/community.management.controller';
import {
    createMsg,
    deleteMsg,
    updateMsg,
    showMsg,
    handleEmoji,
    groupEmoji,
} from '../controllers/community.message.controller';

export const communitySocket=(socket:Socket,io:Server,
    communityRecord:Record<string,string>,
    users:{[key:string]:string}
)=>{
try{

    socket.on("create_community",async(data)=>{
        try{ await createCommunity(data,socket,io); }
        catch(err){ const error=err instanceof Error?err.message:"Unknown Error"; socket.emit("community_error",(error)); }
    });

    socket.on("all_user_community",async(senderId:string)=>{
        try{ await allUserCommunity({senderId},socket); }
        catch(err){ const error=err instanceof Error?err.message:"Unknown Error"; socket.emit("community_error",(error)); }
    });

    socket.on("delete_community",async(data)=>{
        try{ await deleteCommunity(data,socket,io,communityRecord,users); }
        catch(err){ const error=err instanceof Error?err.message:"Unknown Error"; socket.emit("community_error",(error)); }
    });

    socket.on("edit_community_name",async(data)=>{
        try{ await editCommunityName(data,socket,io,users,communityRecord); }
        catch(err){ const error=err instanceof Error?err.message:"Unknown Error"; socket.emit("community_error",(error)); }
    });

    socket.on("edit_community_image",async(data)=>{
        try{ await editCommunityImage(data,socket,io,users); }
        catch(err){ const error=err instanceof Error?err.message:"Unknown Error"; socket.emit("community_error",(error)); }
    });

    socket.on("edit_search_radius",async(data)=>{
        try{ await editSearchRadius(data,socket,io,users); }
        catch(err){ const error=err instanceof Error?err.message:"Unknown Error"; socket.emit("community_error",(error)); }
    });

    socket.on("join_community",async(data)=>{
        try{ await userJoinCommunity(data,socket,io,users); }
        catch(err){ const error=err instanceof Error?err.message:"Unknown Error"; socket.emit("community_error",(error)); }
    });

    socket.on("leave_community",async(data)=>{
        try{ await userLeaveCommunity(data,socket,io,users,communityRecord); }
        catch(err){ const error=err instanceof Error?err.message:"Unknown Error"; socket.emit("community_error",(error)); }
    });

    socket.on("community_data",async(data)=>{
        try{ await communityData(data,socket); }
        catch(err){ const error=err instanceof Error?err.message:"Unknown Error"; socket.emit("community_error",(error)); }
    });

    socket.on("show_nearby_communities",async(data)=>{
        try{ await showNearBy(data,socket); }
        catch(err){ const error=err instanceof Error?err.message:"Unknown Error"; socket.emit("community_error",(error)); }
    });


    //messages

    socket.on("community_msg_creation",async(data)=>{
        try{ await createMsg(data,socket,io,users,communityRecord); }
        catch(err){ const error=err instanceof Error?err.message:"Unknown Error"; socket.emit("community_error",(error)); }
    });

    socket.on("delete_community_msg",async(data)=>{
        try{ await deleteMsg(data,socket,io,users,communityRecord); }
        catch(err){ const error=err instanceof Error?err.message:"Unknown Error"; socket.emit("community_error",(error)); }
    });

    socket.on("edit_community_msg",async(data)=>{
        try{ await updateMsg(data,socket,io,users,communityRecord); }
        catch(err){ const error=err instanceof Error?err.message:"Unknown Error"; socket.emit("community_error",(error)); }
    });

    socket.on("all_prev_community_msg",async(data)=>{
        try{ await showMsg(data,socket); }
        catch(err){ const error=err instanceof Error?err.message:"Unknown Error"; socket.emit("community_error",(error)); }
    });

    socket.on("community_reaction",async(data)=>{
        try{ await handleEmoji(data,socket,io,users,communityRecord); }
        catch(err){ const error=err instanceof Error?err.message:"Unknown Error"; socket.emit("community_error",(error)); }
    });

    socket.on("community_group_emoji_request",async(data)=>{
        try{ await groupEmoji(data,socket); }
        catch(err){ const error=err instanceof Error?err.message:"Unknown Error"; socket.emit("community_error",(error)); }
    });


    //community record ko manage karna - kaun kis community ke chat window me active hai

    socket.on("active_community_user",(data:{communityId:string,senderId:string})=>{
        communityRecord[data.senderId]=data.communityId;
    });

    socket.on("not_active_community_user",(data:{senderId:string})=>{
        delete communityRecord[data.senderId];
    });

}catch(err){
    const error=err instanceof Error?err.message:"Unknown Error";
    socket.emit("community_error",(error));
}
}