const mongoose=require('mongoose')

const wishlistitemSchema=new mongoose.Schema({
   productId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Product',
    required:true
   },
   size: {
    type: String, // assuming size is a string, adjust if necessary
    required: false
 },
 stock: {
    type: Number,
    required: false
 },
 salePrice: {  // Add price to the wishlist item schema
    type: Number,
    required: false
   },
   addedAt:{
    type:Date,
    default:Date.now()
   }
})


const wishlistSchema=new mongoose.Schema({
     userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'users',
        required:true
     },
     items:[wishlistitemSchema],
     totalItems:{
        type:Number,
        default:0
     },
     updatedAt:{
        type:Date,
        default:Date.now()
     }
})

wishlistSchema.pre('save',function(next){
    this.totalItems=this.items.length
    this.updatedAt=Date.now()
    next()
})

const wishlist=mongoose.model('wishlist',wishlistSchema)

module.exports=wishlist