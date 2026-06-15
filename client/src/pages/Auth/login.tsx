import axios from "axios";
import { useState } from "react";
import { env } from "../../configs/env.config";
import { Link } from "react-router-dom";
import { showApiError } from "../../utils/showApiError";
import { useNavigate } from "react-router-dom";
import "./Auth.css";
const Login=()=>{
    const navigate=useNavigate();
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
            localStorage.setItem("token",response.data.token);
            navigate("/ChatPage");
        }
    }catch(err){
        showApiError(err);
    }finally{
        setLoading(false);
    }
}
    return(
        <>
       <div className="wa-auth-container">
  <div className="wa-auth-bg-icons">
    <div className="wa-auth-bg-icon" />
  </div>

  <div className="wa-auth-card">
    <img src="/WhatsApp.svg"alt="WhatsApp"className="wa-signin"/>
    <h1 className="wa-auth-title">Welcome Back</h1>
    <p className="wa-auth-subtitle">
      Sign in to continue chatting
    </p>

    <form className="wa-auth-form" onSubmit={handleSubmit}>
      <div className="wa-auth-input-group">
        <label className="wa-auth-label">Email</label>
        <input className="wa-auth-input" type="email" placeholder="Enter your email"value={email} onChange={(e)=>setEmail(e.target.value)}/>
      </div>

      <div className="wa-auth-input-group">
        <label className="wa-auth-label">Password</label>
        <input className="wa-auth-input"type="password"  placeholder="Enter your password"value={password} onChange={(e)=>setPassword(e.target.value)}/>
      </div>

      <button  className="wa-auth-btn"type="submit" >
        {loading ? <div className="wa-auth-loader" /> : "Login"}
      </button>
    </form>

    <div className="wa-auth-signin-link">
      Don't have an account?{" "}
      <Link to="/Signup" className="wa-auth-link">Sign Up</Link>
    </div>
  </div>
</div>
        </>
    );
}

export default Login;