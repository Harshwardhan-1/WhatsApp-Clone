export interface createChannelConfig{
    senderId:string,
    name:string,
    description?:string,
    profilePic?:string,
    category:string,
}









//message config

export interface createChannelMsgConfig{
    channelId:string,
    senderId:string,
    msgId:string,
    message:string,
    messageType:string,
    orignalname?:string,
    mimetype?:string,
    sizeInKb:number,
    sizeInMb:number,
}