import axios from "axios";
import { useState } from "react";
import { env } from "../../configs/env.config";
import { Link } from "react-router-dom";
import { showApiError } from "../../utils/showApiError";
const Login=()=>{
    const [email,setEmail]=useState("");
    const [password,setPassword]=useState("");
    const [loading,setLoading]=useState<boolean>(false);
    const handleSubmit=async(e:React.FormEvent<HTMLFormElement>)=>{
        e.preventDefault();
        setLoading(true);
        try{
            const send={email,password};
        const response=await axios.post(`${env.backendUrl}/api/v1/auth/login`,send,{withCredentials:true});
        if(response.data.message=== "successfully verified"){
            alert("successfull");
        }
    }catch(err){
        showApiError(err);
    }finally{
        setLoading(false);
    }
}
    return(
        <>
        <form onSubmit={handleSubmit}>
            <input type="email" placeholder="Enter your email here" value={email} onChange={(e)=>setEmail(e.target.value)}  />
            <input type="password" placeholder="Enter your password" value={password} onChange={(e)=>setPassword(e.target.value)} />
            <button type="submit">{loading ? <div className="loader"></div>:"login"}</button>
        </form>
         <div className="signup-link"> Don't have an account?{" "}
          <Link to="/Signup">SignUp</Link>
        </div>
        </>
    );
}

export default Login;