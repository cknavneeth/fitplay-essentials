const mongoose = require("mongoose")

const walletSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:true,  
    },
    balance:{
        type:Number,
        required:true,
    },
    transaction:[
        {
            transactionType:{
                type:String,
                enum:["credit","debit"],
                required:true
            },
            amount:{
                type:Number,
                required:true
            },
            status:{
                type:String,
                default:"completed"
            },
        },
    ]
},
{
    timestamps:true
}
)

 const Wallet = mongoose.model("wallet",walletSchema)
 module.exports=Wallet
