export interface createCallMsg{
    callId:string,
    groupId:string,
    message:string,
    senderId:string,

    //this msgId is basically the msg id like voice video that we are showing 
    msgId:string
}





export interface deleteCallMsg{
    msgId:string,
    groupId:string,
    callId:string,
    senderId:string,
}







export interface updateCallMsg{
    groupId:string
    msgId:string,
    senderId:string,
    message:string,
};




export interface toggleLikeType{
    groupId:string,
    senderId:string,
    msgId:string,
}





export interface groupCallReply{
    callId:string,
    groupId:string,
    senderId:string,
    message:string,

    //the message on which user reply
    parentId:{
        parentId:string,
        message:string,
        senderId:string,
    },
}