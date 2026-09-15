export interface createCommunityType{
    creatorId:string,
    communityName:string,
    searchRadius:string,
    communityImage:string,
    location:{
        type:String,
        coordinates:[number,number],
    },
}



export interface communityMsgType{
    communityId:string,
    senderId:string,
    message:string,
    messageType:string,
    mimetype?:string,
    orignalname?:string,
}