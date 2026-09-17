export interface groupCallCreatedType{
    groupId:string,
    senderId:string,
    receiverId:string[],
    //voice video
    messageType:string,
}