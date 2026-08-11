export const durationtoMs=(duration:string):number|null=>{
    switch (duration){
        case "24hrs":
            return 24*60*60*1000;
        case "7days":
            return 7*24*60*60*1000;
        case "90days":
            return 90*24*60*60*1000;
        default: return null;
    }
}