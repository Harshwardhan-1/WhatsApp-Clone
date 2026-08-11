import z from 'zod';

export const disappearingMessageValidator=z.object({
    senderId:z.string().nonempty("senderId is missing"),
    receiverId:z.string().nonempty('receiverId is missing'),
    duration:z.enum(["24hrs","7days","90days","off"])
});