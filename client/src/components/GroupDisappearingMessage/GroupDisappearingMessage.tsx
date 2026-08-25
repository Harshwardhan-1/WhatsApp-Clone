import { useState } from "react";
import { socket } from "../../utils/socket";
import {useEffect} from 'react';
import { showMessage } from "../../utils/messageToast";
import "../disapperingMessage/disappearing.message.css";

interface prop{
    onBack:()=>void;
    _id:string,
    senderId:string,
}


export function GroupDisappearingMessage({onBack,_id,senderId}:prop){
    const [disappearMessage, setDisappearMessage] = useState("off");
    const [markDisabled,setMarkDisabled]=useState<boolean>(false);

    useEffect(()=>{
        socket.emit("check_can_change",({_id,senderId}));

        socket.emit("current_group_disappearing_val",({_id,senderId}));

        socket.on("group_disappearing_val",(duration:string)=>{
            setDisappearMessage(duration || "off");
        });
        socket.on("can_update_disappearing_message",()=>{
            setMarkDisabled(false);
        });
        socket.on("cannot_update_disappearing_message",()=>{
          setMarkDisabled(true);    
        });

        socket.on("put_group_disappearing_value",(duration:string)=>{
            setDisappearMessage(duration);
        });
        return()=>{
            socket.off("group_disappearing_val");
            socket.off("can_update_disappearing_message");
            socket.off("cannot_update_disappearing_message");
            socket.off("put_group_disappearing_value");

        }
    },[]);


    const handleChange=async(e:React.ChangeEvent<HTMLInputElement>)=>{
        try{
        const value=e.target.value;
        console.log(value);
        setDisappearMessage(value);
        socket.emit("set_group_disappearing_value",({_id,senderId,duration:value}));
        }catch(err:any){
            showMessage(err);
        }
    }


    return (
        <div className="disappearingPage">
            <div className="disappearingHeader">
                <button className="backArrow"onClick={onBack}>←</button>
                <h2>Disappearing messages</h2>
            </div>
            <div className="disappearingImage">
                <img  src="/disappearing_message.png"alt="Disappearing messages"/>
            </div>
            <div className="disappearingDescription">
                <h3> Make messages in this chat disappear</h3>
                <p>
                    For more privacy and storage, all new messages will
                    disappear from this chat for everyone after the
                    selected duration, except when kept. Anyone in the
                    chat can change this setting.
                </p>
                {markDisabled && (
        <p className="adminOnlyNote">
            🔒 Only group admins can change this setting
        </p>
    )}
            </div>
            {/* Options */}
            <div className="disappearingOptions">

                <label className={markDisabled ? "optionDisabled" : ""}>
                    <input type="radio"name="disappearing"value="24hrs" disabled={markDisabled} checked={disappearMessage === "24hrs"}
                     onChange={handleChange}/>
                    <span>24 hours</span>
                </label>

                <label className={markDisabled ? "optionDisabled" : ""}>
                    <input  type="radio"name="disappearing"value="7days" disabled={markDisabled} checked={disappearMessage === "7days"}
                     onChange={handleChange}/>
                    <span>7 days</span>
                </label>

                <label className={markDisabled ? "optionDisabled" : ""}>
                    <input
                        type="radio" name="disappearing"value="90days" disabled={markDisabled} checked={disappearMessage === "90days"}
                        onChange={handleChange}/>
                        <span>90 days</span>
                </label>

                <label className={markDisabled ? "optionDisabled" : ""}>
                    <input type="radio"name="disappearing"value="off" disabled={markDisabled} checked={disappearMessage === "off"}
                        onChange={handleChange}/>
                    <span>Off</span>
                </label>
            </div>
        </div>
    );
}