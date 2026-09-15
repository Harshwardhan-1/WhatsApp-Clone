export interface createStoryConfig{
    senderId:string,
    storyType:"image" | "video",
    link:string,
    message:string,
}


export interface deleteStoryConfig{
    _id:string,
    senderId:string,
}


export interface toggleLikeConfig{
    _id:string,
    senderId:string,
}


export interface viewedByConfig{
    _id:string,
    senderId:string,
}


export interface addReplyConfig{
    //this is story id,
    _id:string,
    //
    parentId:string,
    parentReply:string,
    senderId:string,
    message:string,
}
