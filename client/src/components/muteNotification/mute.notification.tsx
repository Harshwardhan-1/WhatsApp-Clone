import "./mute.notification.css";
import {useState} from 'react';
import { showMessage } from '../../utils/messageToast';
import {socket} from '../../utils/socket';
import { useEffect } from "react";

interface prop{
    onBack:()=>void,
    senderId:string,
    receiverId:string,
}


export function MuteNotification({onBack,senderId,receiverId}:prop){
    const [muted,setMuted]=useState("off");


    useEffect(()=>{
        socket.emit("prev_mark_notification",{senderId,receiverId});
        socket.on("already_mark_notification",(duration:string)=>{
            setMuted(duration || "off");
        });
        socket.on("notification_change",(duration:string)=>{
            setMuted(duration);
        });
        return()=>{
            socket.off("prev_mark_notification");
            socket.off("already_mark_notification");
        }
    },[]);


const handleChange=async(e:React.ChangeEvent<HTMLInputElement>)=>{
    try{
        const value=e.target.value;
        socket.emit("change_notification",({senderId,receiverId,duration:value}));
        console.log(value);
    }catch(err:any){
        console.log(err);
        showMessage(err);
    }
}

    return(
        <div className="muteNotificationPage">
            <div className="muteNotificationHeader">
                <button className="backArrow" onClick={onBack}>←</button>
                <h2>Mute notifications</h2>
            </div>
            <div className="muteNotificationImage">
                <img src="/mute.notification.png" alt="Mute notifications"/>
            </div>
            <div className="muteNotificationDescription">
                <h3>Mute message notification</h3>
                <p>
                    Other members will not see you muted this chat
                </p>
            </div>
            <div className="muteNotificationOptions">
                <label>
                    <input type="radio" name="mutenotification" value="8hrs" checked={muted==="8hrs"} onChange={handleChange}  />
                    <span>8 hours</span>
                </label>
                <label>
                    <input type="radio" name='mutenotification' value="1week" checked={muted==="1week"} onChange={handleChange} />
                    <span>1 week</span>
                </label>
                <label>
                    <input type="radio" name='mutenotification' value="always" checked={muted==="always"} onChange={handleChange} />
                    <span>Always</span>
                </label>
                <label >
                    <input type="radio" name="mutenotification" value="off" checked={muted==="off"} onChange={handleChange} />
                    <span>off</span>
                </label>
            </div>
        </div>
    );
}