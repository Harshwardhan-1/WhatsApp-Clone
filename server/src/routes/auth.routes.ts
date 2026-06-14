import {Router} from 'express';
export const authRouter=Router();
import { signupschema,signinschema } from '../validators/auth.validator';
import { validate } from '../middleware/validation.middleware';
import { signup,signin,logout } from '../controllers/auth.controller';
import { isUserLoggedIn } from '../middleware/auth.middleware';


authRouter.post("/register",validate(signupschema),signup);
authRouter.post("/login",validate(signinschema),signin);
authRouter.post("/logout",isUserLoggedIn,logout);