import { useState } from "react";
export function RegisterPage(){
    const [name,setName]=useState("");
    const [email,setEmail]=useState("");
    const [password,setPassword]=useState("");
    

    const handleSubmit=(e:React.FormEvent<HTMLFormElement>)=>{
        e.preventDefault();
    }
    return(
        <div>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Enter your name"  value={name} onChange={(e)=>setName(e.target.value)}/>
                <input type="email" placeholder="Enter your email here" value={email} onChange={(e)=>setEmail(e.target.value)} />
                <input type="password" placeholder="Enter your password" value={password} onChange={(e)=>setPassword(e.target.value)} />
                <button type="submit">Register</button>
            </form>
        </div>
    );
}