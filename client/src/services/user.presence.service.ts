import { showApiError } from "../utils/showApiError";
import { showMessage } from "../utils/messageToast";
export const userPresence = (date: string) => {
    try {
        const curr = new Date();
        const lastVisit = new Date(date);

        // Normalize both to midnight so only calendar date matters, not time-of-day
        const currDateOnly = new Date(curr.getFullYear(), curr.getMonth(), curr.getDate());
        const lastVisitDateOnly = new Date(lastVisit.getFullYear(), lastVisit.getMonth(), lastVisit.getDate());

        const diff = currDateOnly.getTime() - lastVisitDateOnly.getTime();
        const days = Math.round(diff / (1000 * 60 * 60 * 24)); // round, not floor

        const time = lastVisit.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });

        if (days === 0) return `last seen at ${time}`;
        if (days === 1) return `last seen yesterday at ${time}`;
        if (days < 7) {
            const dayName = lastVisit.toLocaleDateString([], { weekday: "long" });
            return `last seen ${dayName} at ${time}`;
        }
        return lastVisit.toLocaleDateString();
    } catch (err:any) {
        showMessage(err);
        console.log(err);
        return "";
    }
};





export const userChatListPresence=(date:string)=>{
    try{
        //converts it into object
        const curr=new Date();
        const lastVisit = new Date(date);

const diff = curr.getTime()-lastVisit.getTime();
const days = Math.floor(diff/(1000 * 60 * 60 * 24));
const time = lastVisit.toLocaleTimeString([], {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

if (days === 0) {return `${time}`;}
if (days === 1) {return `yesterday`;}
if (days < 7) {
  const dayName = lastVisit.toLocaleDateString([], {weekday: "long",});
  return `${dayName}`;
}
return lastVisit.toLocaleDateString();
    }catch(err){
        showApiError(err);
        console.log(err);
        return "";
    }
}