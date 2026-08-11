import { useState } from "react";
import "./disappearing.message.css";
import { socket } from "../../utils/socket";
import {useEffect} from 'react';
import { showMessage } from "../../utils/messageToast";


interface prop{
    onBack:()=>void;
    senderId:string,
    receiverId:string,
}


export function DisappearingMessage({onBack,senderId,receiverId}:prop){
    const [disappearMessage, setDisappearMessage] = useState("off");

    useEffect(()=>{
        socket.emit("current_disappearing_val",({senderId,receiverId}));
        socket.on("disappearing_val",(duration:string)=>{
            setDisappearMessage(duration);
        });
        return()=>{
            socket.off("disappearing_val");
            socket.off("current_disappearing_val");
        }
    },[]);


    const handleChange=async(e:React.ChangeEvent<HTMLInputElement>)=>{
        try{
        const value=e.target.value;
        console.log(value);
        setDisappearMessage(value);
        socket.emit("disappear_message",{senderId,receiverId,duration:value});
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

            </div>
            {/* Options */}
            <div className="disappearingOptions">

                <label>
                    <input type="radio"name="disappearing"value="24hrs" checked={disappearMessage === "24hrs"}
                     onChange={handleChange}/>
                    <span>24 hours</span>
                </label>

                <label>
                    <input  type="radio"name="disappearing"value="7days" checked={disappearMessage === "7days"}
                     onChange={handleChange}/>
                    <span>7 days</span>
                </label>

                <label>
                    <input
                        type="radio" name="disappearing"value="90days"checked={disappearMessage === "90days"}
                        onChange={handleChange}/>
                        <span>90 days</span>
                </label>

                <label>
                    <input type="radio"name="disappearing"value="off" checked={disappearMessage === "off"}
                        onChange={handleChange}/>
                    <span>Off</span>
                </label>
            </div>
        </div>
    );
}