import { useEffect } from "react";
import axios from 'axios';
import { env } from "../../configs/env.config";
import "./HomePage.css";
import { useNavigate } from "react-router-dom";
const HomePage=()=>{
    const navigate=useNavigate();

    useEffect(()=>{
        const fetch=async()=>{
      try{
        const response=await axios.get(`${env.backendUrl}/api/v1/auth/me`,{withCredentials:true});
        if(response.data.success){
          localStorage.setItem("token",(response.data.token));
          navigate("/chat");
        }
      }catch(err){
        console.log(err);
      }
    };
    fetch();
    },[]);
  return (
    <div className="wp-home-container">
      <div className="wp-home-bg-icons">
        <div className="wp-home-bg-icon wp-home-bg-icon--left" />
        <div className="wp-home-bg-icon wp-home-bg-icon--right" />
        <div className="wp-home-bg-icon wp-home-bg-icon--small" />
      </div>

      <div className="wp-home-content">
        <div className="wp-home-logo-wrap">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
            alt="WhatsApp"
            className="wp-home-logo"
          />
        </div>
        <h1 className="wp-home-title">Welcome to<br />WhatsApp!</h1>
        <p className="wp-home-subtitle">
          Welcome to WhatsApp! Start using this app and tap 'Get Started' to connect and reply to online contacts.
        </p>
      </div>

      <div className="wp-home-footer">
        <button onClick={()=>navigate("/login")} className="wp-home-btn">Get Started</button>
      </div>
    </div>
  );
};

export default HomePage;