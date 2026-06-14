import {Routes,Route} from 'react-router-dom';
import { lazy,Suspense } from 'react';


const RegisterPage=lazy(()=>import("./pages/Auth/signup"));
const Login=lazy(()=>import("./pages/Auth/login"));
function App() {
  return (
    <>
    <Suspense fallback={<div>loading...</div>}>
      <Routes>
        <Route path='/signup' element={<RegisterPage/>}></Route>
        <Route path='/' element={<Login/>}></Route>
      </Routes>
      </Suspense>
    </>
  )
}

export default App
