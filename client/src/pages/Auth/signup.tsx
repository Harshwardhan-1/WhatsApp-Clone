import { useState } from "react";
import { env } from "../../configs/env.config";
import axios,{AxiosError} from 'axios';
import { useNavigate } from "react-router-dom";
const RegisterPage=()=>{
    const navigate=useNavigate();
    const [name,setName]=useState("");
    const [email,setEmail]=useState("");
    const [password,setPassword]=useState("");
    

    const handleSubmit=async(e:React.FormEvent<HTMLFormElement>)=>{
        e.preventDefault();
        try{
        const send={name,email,password};
        const response=await axios.post(`${env.backendUrl}/api/v1/auth/register`,send,{withCredentials:true});
        if(response.data.message=== 'successfully register'){
            navigate("/");
        }
    }catch(err){
        const error=err as AxiosError;
        console.log(error);
    }
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

export default RegisterPage