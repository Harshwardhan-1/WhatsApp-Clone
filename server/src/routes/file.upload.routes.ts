import {Router} from 'express';
export const fileuploadRouter=Router();

import { isUserLoggedIn } from '../middleware/auth.middleware';
import { fileupload } from '../controllers/file.controller';
import { upload } from '../middleware/multer.middleware';

fileuploadRouter.post("/upload",isUserLoggedIn,upload.single("file"),fileupload);