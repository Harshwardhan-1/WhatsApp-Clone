import { useState } from "react";
import { env } from "../../configs/env.config";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { showApiError } from "../../utils/showApiError";
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
    } 
  };

  return (
    <div className="wa-auth-container">
      <div className="wa-auth-bg-icons">

      </div>

      <div className="wa-auth-card">
        <div className="wa-auth-logo-wrap">
          <img src="../public/WhatsApp.svg"alt="WhatsApp" className="wa-auth-logo"/>
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
      </div>
    </div>
  );
};

export default RegisterPage;