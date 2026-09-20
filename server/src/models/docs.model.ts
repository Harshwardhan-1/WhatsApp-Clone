import mongoose,{Document,Types} from 'mongoose';



export interface IDocs extends Document{
   creatorId:Types.ObjectId,
   docsName:string,
   docsData:Buffer,
   
   editPermission:Types.ObjectId[],
   viewPermission:Types.ObjectId[],
   requestToEdit:Types.ObjectId[],
   download:Types.ObjectId[],
}








const docsSchema=new mongoose.Schema<IDocs>({
    creatorId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:[true,'creator Id is missing']
    },
    docsName:{
        type:String,
        required:[true,'docs name is required'],
        minLength:[3,'name must be atleast 3 characters'],
        maxLength:[100,'name cannot be more than 100 characters'],
    },
    docsData:{
        type:Buffer,
    },
    editPermission:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"user",
        },
    ],
    viewPermission:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"user",
        },
    ],
    requestToEdit:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"user",
        },
    ],
    download:[
    {
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
    },
    ],
},
{timestamps:true}
)







export const docs=mongoose.model<IDocs>("docs",docsSchema);