import axios, { AxiosError } from "axios";
import { useState } from "react";
import { env } from "../../configs/env.config";
const Login=()=>{
    const [email,setEmail]=useState("");
    const [password,setPassword]=useState("");

    const handleSubmit=async(e:React.FormEvent<HTMLFormElement>)=>{
        e.preventDefault();
        try{
            const send={email,password};
        const response=await axios.post(`${env.backendUrl}/api/v1/auth/login`,send,{withCredentials:true});
        if(response.data.message=== "successfully verified"){
            alert("successfull");
        }
    }catch(err){
        console.log(err);
        const error=err as AxiosError;
        if(error.response && error.response.data){
            const data=error.response.data;
            alert(data);
        }
    }
}
    return(
        <>
        <form onSubmit={handleSubmit}>
            <input type="email" placeholder="Enter your email here" value={email} onChange={(e)=>setEmail(e.target.value)}  />
            <input type="password" placeholder="Enter your password" value={password} onChange={(e)=>setPassword(e.target.value)} />
            <button type="submit">login</button>
        </form>
        </>
    );
}

export default Login;