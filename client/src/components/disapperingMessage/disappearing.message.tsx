import { useState } from "react";
import "./disappearing.message.css";

interface prop{
    onBack:()=>void;
}


export function DisappearingMessage({onBack}:prop){
    const [disappearMessage, setDisappearMessage] = useState("off");

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
                     onChange={(e)=>setDisappearMessage(e.target.value)}/>
                    <span>24 hours</span>
                </label>

                <label>
                    <input  type="radio"name="disappearing"value="7days" checked={disappearMessage === "7days"}
                     onChange={(e)=>setDisappearMessage(e.target.value)}/>
                    <span>7 days</span>
                </label>

                <label>
                    <input
                        type="radio" name="disappearing"value="90days"checked={disappearMessage === "90days"}
                        onChange={(e)=>setDisappearMessage(e.target.value)}/>
                        <span>90 days</span>
                </label>

                <label>
                    <input type="radio"name="disappearing"value="off" checked={disappearMessage === "off"}
                        onChange={(e) =>setDisappearMessage(e.target.value)}/>
                    <span>Off</span>
                </label>
            </div>
        </div>
    );
}