import {useState,useEffect} from 'react';
import { socket } from '../../../utils/socket';
import { showMessage } from '../../../utils/messageToast';
import "../../ChatMedia/links/link.css";

interface prop{
    onBack:()=>void,
    _id:string,
    senderId:string,
}

interface Link{
    senderId:string,
    receiverId:string,
    message:string,
    messageType:string,
    createdAt:Date,
    updatedAt:Date,
}

const extractUrl=(message:string)=>{
    const match=message.match(/((?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/i);
    return match ? match[0] : message;
}

const toHref=(url:string)=>{
    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

const extractDomain=(url:string)=>{
    try{
        const u=new URL(toHref(url));
        return u.hostname.replace("www.","");
    }catch{
        return url;
    }
}

const formatDate=(date:Date)=>{
    const d=new Date(date);
    const dd=String(d.getDate()).padStart(2,'0');
    const mm=String(d.getMonth()+1).padStart(2,'0');
    const yyyy=d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

export function GroupLinks({onBack,_id,senderId}:prop){
    const [data,setData]=useState<Link[]>([]);

    const handleLinks=async(allLinks:Link[])=>{
        try{
            setData(allLinks);
        }catch(err:any){
            showMessage(err);
        }
    }

    useEffect(()=>{
        socket.emit("get_all_group_links",({_id,senderId}));
        socket.on("got_all_group_links",handleLinks);
        return()=>{
            socket.off("got_all_group_links",handleLinks);
        }
    },[]);
    
    return(
        <div className="linksPage">
            <div className="linksHeader">
                <span className="backArrow" onClick={onBack}>←</span>
                <h2>Links</h2>
            </div>

            <div className="linksList">
                {data.length===0 && (
                    <div className="noLinksFound">No links found</div>
                )}

                {data.map((all,index)=>{
                    const url=extractUrl(all.message);
                    const href=toHref(url);
                    const domain=extractDomain(url);
                    return(
                        <a
                            key={index}
                            className="linkRow"
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <div className="linkIconBox">🔗</div>
                            <div className="linkInfo">
                                <span className="linkDomain">{domain}</span>
                                <span className="linkUrl">{url}</span>
                            </div>
                            <span className="linkDate">{formatDate(all.createdAt)}</span>
                        </a>
                    )
                })}
            </div>
        </div>
    );
}