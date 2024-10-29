const mongoose=require('mongoose')

const cartItemSchema=new mongoose.Schema({
    productId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Product',
        required:true
    },
    quantity:{
        type:Number,
        required:true,
        min:1,
        default:1
    },
    price:{
        type:Number,
        required:true
    },
    totalPrice:{
        type:Number,
        required:true
    }
})

const cartSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'users',
        required:true
    },
    items:[cartItemSchema],
    totalItems:{
        type:Number,
        default:0
    },
    totalPrice:{
        type:Number,
        default:0
    },
    updatedAt:{
        type:Date,
        default:Date.now
    }

})

cartSchema.pre('save',function(next){
    this.totalItems=this.items.length,
    this.totalAmount=this.items.reduce((sum,items)=>sum+items.totalPrice,0)
    next()
})

const cart=mongoose.model('Cart',cartSchema)

module.exports=cart