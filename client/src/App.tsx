import {Routes,Route} from 'react-router-dom';
import { lazy,Suspense } from 'react';
import { useEffect } from 'react';
import { socket } from './utils/socket';
import "./App.css";

const RegisterPage=lazy(()=>import("./pages/Auth/signup"));
const Login=lazy(()=>import("./pages/Auth/login"));
const HomePage=lazy(()=>import("./pages/HomePage/HomePage"));
const ChatListPage=lazy(()=>import("./pages/ChatList/ChatListPage"));
const ChatPage=lazy(()=>import("./pages/Chat/chatPage"));
const LoadingScreen = () => (
  <div className="ap-loading-container">
    <div className="ap-loading-logo">
      <svg width="72" height="72" viewBox="0 0 22 22" fill="none">
        <rect className="logo-square sq-1" x="2" y="2" width="8" height="8" rx="5" fill="currentColor" />
        <rect className="logo-square sq-2" x="12" y="2" width="8" height="8" rx="2" fill="currentColor" />
        <rect className="logo-square sq-3" x="2" y="12" width="8" height="8" rx="2" fill="currentColor" />
        <rect className="logo-square sq-4" x="12" y="12" width="8" height="8" rx="5" fill="currentColor" />
      </svg>
    </div>

    <p className="ap-loading-text">Loading...</p>
  </div>
);


function App() {

  useEffect(()=>{
    if(!socket.connected){
      socket.connect();
    }
    return()=>{
      socket.disconnect();
    }
  },[]);
  return (
    <>
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path='/signup' element={<RegisterPage/>}></Route>
        <Route path='/login' element={<Login/>}></Route>
        <Route path='/' element={<HomePage />}></Route>
        <Route path='/ChatListPage' element={<ChatListPage />}></Route>
        <Route path='/ChatPage' element={<ChatPage />}></Route>
      </Routes>
      </Suspense>
    </>
  )
}

export default App



//next task 
// 1show error alert 
// 2show online offline status
//3 last time message on dashboard
//4 show time of message deleiver