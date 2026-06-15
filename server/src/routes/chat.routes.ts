import {Router} from 'express';
export const chatpageRoutes=Router();

import { allUsers } from '../controllers/auth.controller';
import { isUserLoggedIn } from '../middleware/auth.middleware';

chatpageRoutes.get("/alluser",isUserLoggedIn,allUsers);