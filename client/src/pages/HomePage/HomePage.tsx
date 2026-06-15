import "./HomePage.css";
import { useNavigate } from "react-router-dom";
const HomePage = () => {
    const navigate=useNavigate();
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