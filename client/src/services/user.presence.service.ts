import { showApiError } from "../utils/showApiError"

export const userPresence=(date:string)=>{
    try{
        //converts it into object
        const curr=new Date();
        const lastVisit=new Date(date);
        const diff=curr.getTime()-lastVisit.getTime();
        const sec=Math.floor(diff/1000);
        const min=Math.floor(sec/60);
        const hr=Math.floor(min/60);
        const day=Math.floor(hr/24);
        console.log("this runs");

        if(sec<60)return "last seen just now";
        if(min<60) return `last seen ${min} minutes ago`;
        if(hr<24) return `last seen ${hr} hour ago`;
        if(day<7)return `last seen ${day} days ago`

        return lastVisit.toLocaleDateString();
    }catch(err){
        showApiError(err);
        console.log(err);
        return "";
    }
}