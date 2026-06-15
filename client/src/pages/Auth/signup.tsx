import { useState } from "react";
import { env } from "../../configs/env.config";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { showApiError } from "../../utils/showApiError";
import "./Auth.css";


const RegisterPage=()=>{
    const navigate=useNavigate();
    const [name,setName]=useState("");
    const [email,setEmail]=useState("");
    const [password,setPassword]=useState("");
    const [loading,setLoading]=useState<boolean>(false);
    

    const handleSubmit=async(e:React.FormEvent<HTMLFormElement>)=>{
        e.preventDefault();
        try{
            setLoading(true);
        const send={name,email,password};
        const response=await axios.post(`${env.backendUrl}/api/v1/auth/register`,send,{withCredentials:true});
        if(response.data.message=== 'successfully register'){
            navigate("/");
        }
    }catch(err){
       showApiError(err);
    }finally{
        setLoading(false);
    }
}
    return(
        <div>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Enter your name"  value={name} onChange={(e)=>setName(e.target.value)}/>
                <input type="email" placeholder="Enter your email here" value={email} onChange={(e)=>setEmail(e.target.value)} />
                <input type="password" placeholder="Enter your password" value={password} onChange={(e)=>setPassword(e.target.value)} />
                <button type="submit">{loading?<div className="loader"></div>:"Register"}</button>
            </form>
              <div className="signin-link">Already have an account?{" "}
              <Link to="/">Login</Link>
           </div>
        </div>
    );
}

export default RegisterPage