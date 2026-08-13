import { showMessage } from "../utils/messageToast";

export function notificationSound(){
    try{
        const audio=new Audio("./notification.sound.mp3");
        audio.play();
    }catch(err:any){
        console.log(err);
        showMessage("audio play blocked");   
    }
}