import { env } from "../configs/env.config";
import {io,Socket} from "socket.io-client";


//custom socket includes all property of Socket
interface customSocket extends Socket{
    hasJoined?:boolean,
}

export const socket:customSocket=io(`${env.backendUrl}`,{
    autoConnect:false,
})