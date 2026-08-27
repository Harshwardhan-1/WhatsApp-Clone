import mongoose,{Document,Types} from 'mongoose';

export interface IGroupMessage extends Document{
    _id:Types.ObjectId,

    inviteToken:string,
    groupName:string,
    //this sender id is basically for a person who create group
     groupCreatorId:Types.ObjectId,
      
     //this is basically all the receiverId we will convert it to objectId
     peoplesId:Types.ObjectId[],


     admin:Types.ObjectId[],

     removedMembers:Types.ObjectId[],

     exitAndDelete:Types.ObjectId[],

     groupImage?:string,

     canChangeGroupName:boolean,
     canChangeGroupImage:boolean,
     canAddGroupMembers:boolean,
     canRemoveGroupMembers:boolean,
     changeDisappearingMessageSetting:boolean,
     onlyAdminSendMessage:boolean,

     groupPermission:boolean,

     isGroupDeleted?:boolean,

     createdAt:Date,
     updatedAt:Date,
}



const groupChat=new mongoose.Schema<IGroupMessage>({

    //this one is for qr login only

    inviteToken:{
        type:String,
        required:[true,'invitetoken is required'],
        unique:[true,'invite token must be unique'],
        default:"",
    },
    groupName:{
        type:String,
        required:[true,'groupName is required'],
        // unique:[true,'groupName must be unique'],
        trim:true,
        minLength:[3,"groupName must be atleast 3 characters"],
        maxLength:[100,'groupName should not be greater than 100 characters'],
    },
        groupCreatorId:{
          type:Types.ObjectId,
          ref:"user",
          required:[true,'group id is missing'],
    },
    peoplesId:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"user",
            default:[],
        },
    ],
    admin:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"user",
            default:[],
        },
    ],
    removedMembers:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"user",
            default:[],
        },
    ],
    exitAndDelete:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"user",
            default:[],
        },
    ],
    groupImage:{
        type:String,
        default:"",
    },
    canChangeGroupName:{
        type:Boolean,
        default:false,
    },
    canChangeGroupImage:{
        type:Boolean,
        default:false,
    },
    canAddGroupMembers:{
        type:Boolean,
        default:false,
    },
    canRemoveGroupMembers:{
        type:Boolean,
        default:false,
    },
    changeDisappearingMessageSetting:{
        type:Boolean,
        default:false,
    },
    onlyAdminSendMessage:{
        type:Boolean,
        default:false,
    },
    groupPermission:{
        type:Boolean,
        default:false,
    },
    createdAt:{
    type:Date,
    default:Date.now,
},
isGroupDeleted:{
    type:Boolean,
    default:false,
},
updatedAt:{
    type:Date,
    default:Date.now,
},
},

{timestamps:true}

);



export const groupChatModel=mongoose.model<IGroupMessage>("create_group",groupChat);
