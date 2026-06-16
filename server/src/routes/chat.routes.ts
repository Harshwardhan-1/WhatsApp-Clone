import {Router} from 'express';
export const chatpageRoutes=Router();

import { allUsers } from '../controllers/auth.controller';
import { isUserLoggedIn } from '../middleware/auth.middleware';
import { prevChat } from '../controllers/chat.controller';

chatpageRoutes.get("/alluser",isUserLoggedIn,allUsers);    
chatpageRoutes.post("/prevChat",isUserLoggedIn,prevChat);