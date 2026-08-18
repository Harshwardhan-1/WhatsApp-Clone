import {Router} from 'express';
import { isUserLoggedIn } from '../middleware/auth.middleware';
import { storiesUpload } from '../middleware/stories.middleware';
import { uploadStoryInformation } from '../controllers/stories.controller';

export const storyRoutes=Router();


storyRoutes.post("/uploadStory",isUserLoggedIn,storiesUpload.single("story"),uploadStoryInformation);