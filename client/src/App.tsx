import {Routes,Route} from 'react-router-dom';
import { RegisterPage } from './pages/SignUpPage/signup';
import { Login } from './pages/loginPage/login';
function App() {

  return (
    <>
      <Routes>
        <Route path='/signup' element={<RegisterPage/>}></Route>
        <Route path='/' element={<Login/>}></Route>
      </Routes>
    </>
  )
}

export default App
