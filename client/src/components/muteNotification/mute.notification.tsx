import "./mute.notification.css";
import {useState} from 'react';
import { showMessage } from '../../utils/messageToast';

interface prop{
    onBack:()=>void,
    senderId:string,
    receiverId:string,
}


export function MuteNotification({onBack,senderId,receiverId}:prop){
    const [muted,setMuted]=useState("off");

const handleChange=async(e:React.ChangeEvent<HTMLInputElement>)=>{
    try{
        const value=e.target.value;
        setMuted(value);
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