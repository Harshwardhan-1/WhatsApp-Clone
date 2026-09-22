export interface DocsMessage{
    docsId:string,
    senderId:string,
    message:string,
}




export interface DeleteDocsMsg{
    docsId:string,
    senderId:string,
    msgId:string,
}





export interface ParentReply{
    docsId:string,
    senderId:string,
    message:string,
    parentData:{
        //this is the id at which user reacts
        parentId:string,
        senderId:string,
        message:string,
    }
}