import { useEffect } from "react";
import { socket } from "../../../utils/socket";
import {useState} from 'react';
import { showMessage } from "../../../utils/messageToast";
import { env } from "../../../configs/env.config";
import "../../ChatMedia/docs/docs.css";

interface prop{
    onBack:()=>void,
    _id:string,
    senderId:string,
}


interface media{
_id:string,
senderId:string,
message:string,
messageType:string,
mimetype:string,
filename:string,
sizeInKb:number,
sizeInMb:number,
}



export function GroupMedia({onBack,_id,senderId}:prop){
    
    const [data,setData]=useState<media[]>([]);
    const [selected,setSelected]=useState<media|null>(null);

    const handleAllMedia=async(allMedia:media[])=>{
        try{
        setData(allMedia);
        }catch(err:any){
            showMessage(err);
        }    
    }


    useEffect(()=>{
        socket.emit("all_group_media",{_id,senderId});
        socket.on("found_all_group_media",handleAllMedia);
        return()=>{
            socket.off("found_all_group_media",handleAllMedia);
        }
    },[]);
    return(
        <div className="mediaPage">
            <div className="mediaHeader">
                <span className="backArrow" onClick={onBack}>←</span>
                <h2>Media</h2>
            </div>

            <div className="mediaGrid">
                {data.length===0 && (
                    <div className="noMediaFound">No media found</div>
                )}
                {data.map((all,index)=>(
                    <div key={index} className="mediaThumb" onClick={()=>setSelected(all)}>
                        {all?.mimetype.startsWith("image/") && (
                            <img src={`${env.backendUrl}${all.message}`} alt={all.filename} />
                        )}
                        {all?.mimetype.startsWith("video/") && (
                            <div className="videoThumbWrap">
                                <video src={`${env.backendUrl}${all.message}`} preload="metadata" muted />
                                <span className="playIcon">▶</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {selected && (
                <div className="mediaPreviewOverlay" onClick={()=>setSelected(null)}>
                    <div className="mediaPreviewTop">
                        <span className="backArrow" onClick={()=>setSelected(null)}>←</span>
                        <span className="mediaPreviewName">{selected.filename}</span>
                    </div>
                    <div className="mediaPreviewContent" onClick={(e)=>e.stopPropagation()}>
                        {selected.mimetype.startsWith("image/") && (
                            <img src={`${env.backendUrl}${selected.message}`} alt={selected.filename} />
                        )}
                        {selected.mimetype.startsWith("video/") && (
                            <video src={`${env.backendUrl}${selected.message}`} controls autoPlay />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}