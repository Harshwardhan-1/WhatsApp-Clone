import { useState } from "react";
import { env } from "../../configs/env.config";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { showApiError } from "../../utils/showApiError";
import { GoogleLogin } from "@react-oauth/google";
import "./Auth.css";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit=async(e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);
      const send = { name, email, password };
      const response = await axios.post(`${env.backendUrl}/api/v1/auth/register`,send,{ withCredentials: true });
      if (response.data.message === "successfully register") {
        navigate("/login");
      }
    } catch (err) {
      showApiError(err);
    }finally{
        setLoading(false);
    }
  };

  return (
    <div className="wa-auth-container">
      <div className="wa-auth-bg-icons">

      </div>

      <div className="wa-auth-card">
        <div className="wa-auth-logo-wrap">
          <img src="/WhatsApp.svg"alt="WhatsApp" className="wa-auth-logo"/>
         </div>

        <h1 className="wa-auth-title">Create account</h1>
        <p className="wa-auth-subtitle">Enter your details to get started</p>
        <form className="wa-auth-form" onSubmit={handleSubmit}>
          <div className="wa-auth-input-group">
            <label className="wa-auth-label">Your name</label>
            <input className="wa-auth-input" type="text"placeholder="Enter your name"value={name}onChange={(e)=>setName(e.target.value)}/>
          </div>
          <div className="wa-auth-input-group">
            <label className="wa-auth-label">Email</label>
            <input className="wa-auth-input" type="email" placeholder="Enter your email here"value={email}onChange={(e) => setEmail(e.target.value)}/>
          </div>

          <div className="wa-auth-input-group">
            <label className="wa-auth-label">Password</label>
            <input className="wa-auth-input" type="password"  placeholder="Enter your password" value={password}onChange={(e)=>setPassword(e.target.value)}/>
          </div>

          <button className="wa-auth-btn" type="submit" disabled={loading}>
            {loading ? <div className="wa-auth-loader" /> : "Register"}
          </button>
        </form>

        <div className="wa-auth-signin-link">
          Already have an account?{" "}
          <Link to="/login" className="wa-auth-link">Login</Link>
        </div>
         
    <div className="wa-auth-divider"><span>or</span></div>
     <div className="wa-auth-google">
       <GoogleLogin
        onSuccess={async(res)=>{
      try {
        const response = await axios.post(
          `${env.backendUrl}/api/v1/auth/google`,
          { credential: res.credential },
          { withCredentials: true }
        );
        if (response.data.success) {
          localStorage.setItem("token", response.data.token);
          navigate("/chat");
        }
      } catch (err) {
        showApiError(err);
      }
    }}
    onError={() =>onsole.log("Google login fail")}
    theme="outline"
    size="large"
    shape="pill"
    text="signin_with"
    logo_alignment="left"
    width="320"
  />
</div>
      </div>
    </div>
  );
};

export default RegisterPage;