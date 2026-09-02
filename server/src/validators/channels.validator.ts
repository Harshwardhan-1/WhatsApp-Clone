import z from 'zod';
import {Types} from 'mongoose';
export const createChannelValidate=z.object({
    name:z.string()
    .min(3,'name cannot be less than 3 characters')
    .max(100,'name cannot be greater than 100 characters'),

    description:z.string()
    .min(10,'channel description must be atleast 10 characters')
    .max(100,'channl description cannot be more rhan 100 characters')
    .optional(),

    profilePic:z.string().optional(),

    category:z.enum(["sports","entertainment","technology","news","education","business","other"]),
});