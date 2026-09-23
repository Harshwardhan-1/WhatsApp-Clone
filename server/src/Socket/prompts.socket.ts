import { Socket, Server } from 'socket.io';
import {
    createChatListMessage,
    create,
    deleteMsg,
    deleteChatListItem,
    renameChatListItem,
    reaction,
    allMsg,
    allChatList,
} from '../controllers/ai.chat.controller';

const getError = (err: unknown) => (err instanceof Error ? err.message : "Unknown Error");

export const promptSocket = async (socket: Socket, io: Server, users: { [key: string]: string }) => {
    const handle = <T>(event: string, fn: (data: T, socket: Socket) => Promise<void>) => {
        socket.on(event, async (data: T) => {
            try {
                await fn(data, socket);
            } catch (err) {
                socket.emit("prompt_error", getError(err));
            }
        });
    };

    handle("get_all_chat_list", allChatList);                
    handle("create_chat_list_msg", createChatListMessage);   
    handle("get_all_chat_message", allMsg);                  
    handle("create_prompt_msg", create);                     
    handle("delete_prompt_msg", deleteMsg);                  
    handle("delete_chat_list_item", deleteChatListItem);     
    handle("rename_chat_list_item", renameChatListItem);   
    handle("prompt_reaction", reaction);
};