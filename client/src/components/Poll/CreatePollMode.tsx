import { useState } from "react";
import "./CreatePollModel.css";

interface CreatePollModalProps{
    onClose:()=>void;
    onCreate:(data:{title:string,selectOptions:boolean,polldata:{msg:string,peoplesId:string[]}[]})=>void;
}

export function CreatePollModal({onClose,onCreate}:CreatePollModalProps){
    const [title,setTitle]=useState("");
    const [options,setOptions]=useState<string[]>(["",""]);
    const [selectOptions,setSelectOptions]=useState(false);

    const updateOption=(index:number,value:string)=>{
        setOptions(prev=>prev.map((opt,i)=>i===index?value:opt));
    };

    const addOption=()=>{
        if(options.length>=12)return;
        setOptions(prev=>[...prev,""]);
    };

    const removeOption=(index:number)=>{
        if(options.length<=2)return;
        setOptions(prev=>prev.filter((_,i)=>i!==index));
    };

    const handleSubmit=(e:React.FormEvent)=>{
        e.preventDefault();
        const trimmedTitle=title.trim();
        const cleanOptions=options.map(o=>o.trim()).filter(o=>o.length>0);

        if(trimmedTitle.length===0){
            alert("title is missing");
            return;
        }
        if(cleanOptions.length<2){
            alert("at least 2 options");
            return;
        }

        onCreate({
            title:trimmedTitle,
            selectOptions,
            polldata:cleanOptions.map(msg=>({msg,peoplesId:[]})),
        });
        onClose();
    };

    return(
        <div className="pollModalOverlay" onClick={onClose}>
            <div className="pollModalBox" onClick={(e)=>e.stopPropagation()}>
                <h3>Create Poll</h3>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Ask a question"
                        value={title}
                        onChange={(e)=>setTitle(e.target.value)}
                        className="pollTitleInput"
                        autoFocus
                    />

                    <div className="pollOptionsList">
                        {options.map((opt,index)=>(
                            <div key={index} className="pollOptionRow">
                                <input
                                    type="text"
                                    placeholder={`Option ${index+1}`}
                                    value={opt}
                                    onChange={(e)=>updateOption(index,e.target.value)}
                                />
                                {options.length>2 && (
                                    <button type="button" onClick={()=>removeOption(index)}>✕</button>
                                )}
                            </div>
                        ))}
                    </div>

                    {options.length<12 && (
                        <button type="button" className="pollAddOptionBtn" onClick={addOption}>
                            + Add option
                        </button>
                    )}

                    <label className="pollMultiSelectLabel">
                        <input
                            type="checkbox"
                            checked={selectOptions}
                            onChange={(e)=>setSelectOptions(e.target.checked)}
                        />
                        Allow multiple answers
                    </label>

                    <div className="pollModalActions">
                        <button type="button" onClick={onClose}>Cancel</button>
                        <button type="submit">Create Poll</button>
                    </div>
                </form>
            </div>
        </div>
    );
}