import {Router} from 'express';
export const fileuploadRouter=Router();

import { isUserLoggedIn } from '../middleware/auth.middleware';
import { fileupload } from '../controllers/file.controller';
import { upload } from '../middleware/multer.middleware';
import { profileSettings } from '../middleware/group.settings.middleware';

fileuploadRouter.post("/upload",isUserLoggedIn,upload.single("file"),fileupload);
fileuploadRouter.post("/groupImage",isUserLoggedIn,profileSettings.single("file"),fileupload);