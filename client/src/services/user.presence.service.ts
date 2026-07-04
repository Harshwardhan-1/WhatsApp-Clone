import { showApiError } from "../utils/showApiError"

export const userPresence=(date:string)=>{
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

if (days === 0) {return `last seen at ${time}`;}
if (days === 1) {return `last seen yesterday at ${time}`;}
if (days < 7) {
  const dayName = lastVisit.toLocaleDateString([], {weekday: "long",});
  return `last seen ${dayName} at ${time}`;
}
return lastVisit.toLocaleDateString();
    }catch(err){
        showApiError(err);
        console.log(err);
        return "";
    }
}