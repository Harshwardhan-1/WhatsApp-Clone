import {Router} from 'express';
import { isUserLoggedIn } from '../middleware/auth.middleware';
import { 
    createGroupQr,
    joinGroup
 } from '../controllers/group.management.controller';


export const groupRoutes=Router();

groupRoutes.get("/:id",isUserLoggedIn,createGroupQr);
groupRoutes.get("/group/join/:inviteLink",isUserLoggedIn,joinGroup);