
export interface createGroupMessageConfig{
    _id:string,
    senderId:string,
    message:string,
    messageType:string,
    fileUrl:string,
    mimetype?:string,
    filename?:string,
    sizeInKb?:number,
    sizeInMb?:number,
    originalname?:string,
}



export interface messageAction{
    _id:string,
    msgId:string,
    senderId:string,
    message:string,
}



export interface clearChatConfig{
    _id:string,//groupId 
    senderId:string,
}


export interface messageInfoConfig{
    _id:string,
    msgId:string,
    senderId:string,
}



export interface seenByConfig{
    _id:string,//this is group id
    senderId:string,
}

export interface deleiveredToConfig{
    _id:string,
    senderId:string,
}



export interface groupLastMessageConfig{
    _id:string,//this is group id
    groupId:string,
    senderId:string,
    msgId:string,
    message:string,
    messageType:string,
    filename?:string,
    orignalname?:string,
    mimetype?:string,
    createdAt:Date,
    updatedAt:Date,
}