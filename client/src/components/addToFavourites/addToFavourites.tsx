import { socket } from "../../utils/socket";
import { showMessage } from "../../utils/messageToast";
import {useState,useEffect} from 'react';

export function addToFavourites(senderId:string,receiverId:string){
    const [alreadyMarked,notAlreadyMarked]=useState<string>("");
    useEffect(()=>{
        if(!senderId || !receiverId){
            return;
        }
        try{
            socket.emit("check_favourites",({senderId,receiverId}));
            socket.on("checked_as_favourites",(favourites:string)=>{
                notAlreadyMarked(favourites);
            });
            socket.on("toggle_favourites",(favourites:string)=>{
                notAlreadyMarked(favourites);
            });
            return()=>{
                socket.off("checked_as_favourites");
                socket.off("toggle_favourites");
            }
        }catch(err:any){
            showMessage(err);
        }
    },[senderId,receiverId]);

     const markAsFavourites=(data:{senderId:string,receiverId:string})=>{
        socket.emit("mark_as_favourites",({senderId:data.senderId,receiverId:data.receiverId}));
    }
        const unmarkAsFavourites=(data:{senderId:string,receiverId:string})=>{
            socket.emit("unmark_as_favourites",({senderId:data.senderId,receiverId:data.receiverId}))
        }


    return {alreadyMarked,markAsFavourites,unmarkAsFavourites};
}