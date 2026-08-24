import {useState,useEffect} from 'react';
import { socket } from '../../../utils/socket';
import { showMessage } from '../../../utils/messageToast';
import { env } from '../../../configs/env.config';
import "../../ChatMedia/docs/docs.css";


interface prop{
    onBack:()=>void,
    _id:string,
    senderId:string,
}

interface docs{
    senderId:string,
    receiverId:string,
    message:string,
    messageType:string,
    mimetype:string,
    filename:string,
    sizeInKb:number,
    sizeInMb:number,
    createdAt:Date,
}

const getFileInfo=(mimetype:string,filename:string)=>{
    const ext=filename?.split(".").pop()?.toUpperCase() || "FILE";

    if(mimetype?.includes("pdf")) return {label:"PDF",ext:"PDF",className:"pdf"};
    if(mimetype?.includes("presentation") || mimetype?.includes("powerpoint")) return {label:"P",ext:ext||"PPTX",className:"ppt"};
    if(mimetype?.includes("wordprocessing") || mimetype?.includes("msword")) return {label:"W",ext:ext||"DOCX",className:"doc"};
    if(mimetype?.includes("spreadsheet") || mimetype?.includes("excel")) return {label:"X",ext:ext||"XLSX",className:"xls"};

    return {label:ext.charAt(0),ext,className:"generic"};
}

const formatSize=(kb:number)=>{
    if(!kb && kb!==0) return "";
    if(kb>=1024) return `${(kb/1024).toFixed(1)} MB`;
    return `${Math.round(kb)} kB`;
}

const formatDate=(date:Date)=>{
    const d=new Date(date);
    const dd=String(d.getDate()).padStart(2,'0');
    const mm=String(d.getMonth()+1).padStart(2,'0');
    const yyyy=d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

export function GroupDocs({onBack,_id,senderId}:prop){

    const [data,setData]=useState<docs[]>([]);

    const handleDocs=async(allDocs:docs[])=>{
        try{
            setData(allDocs);
        }catch(err:any){
            showMessage(err);
        }
    }
    useEffect(()=>{
        socket.emit("all_group_docs",({_id,senderId}));
        socket.on("get_all_group_docs",handleDocs);
        return()=>{
            socket.off("get_all_group_docs",handleDocs);
        }
    },[]);
    
    return(
        <div className="docsPage">
            <div className="docsHeader">
                <span className="backArrow" onClick={onBack}>←</span>
                <h2>Docs</h2>
            </div>

            <div className="docsList">
                {data.length===0 && (
                    <div className="noDocsFound">No docs found</div>
                )}

                {data.map((all,index)=>{
                    const fileInfo=getFileInfo(all.mimetype,all.filename);
                    return(
                        <a
                            key={index}
                            className="docRow"
                            href={`${env.backendUrl}${all.message}`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <div className={`docIconBox ${fileInfo.className}`}>
                                {fileInfo.label}
                            </div>
                            <div className="docInfo">
                                <span className="docName">{all.filename}</span>
                                <span className="docMeta">{fileInfo.ext} · {formatSize(all.sizeInKb)}</span>
                            </div>
                            <span className="docDate">{formatDate(all.createdAt)}</span>
                        </a>
                    )
                })}
            </div>
        </div>
    );
}