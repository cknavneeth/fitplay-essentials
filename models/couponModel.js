const mongoose=require('mongoose')

const couponSchema=new mongoose.Schema({
    code:{
        type:String,
        required:true,
        unique:true,
        uppercase:true
    },
    discountType:{
        type:String,
        enum:['percentage','fixed'],
        required:true
    },
    discountAmount:{
        type:Number,
        required:true
    },
    minPurchaseAmount:{
        type:Number,
        required:true
    },
    expirationDate:{
        type:Date,
        required:true
    },
    maxDiscount: {
        type: Number,
        default: null, 
      },
      usageLimit: {
        type: Number,
        default: null, 
      },
      perUserLimit: {
        type: Number,
        default: null, 
      },
      usedCount: {
        type: Number,
        default: 0, 
      },
      isActive: {
        type: Boolean,
        default: true,
      },
      isCouponApplied: {
        type: Boolean,
        default: false
    }
})


const coupon=mongoose.model('coupon',couponSchema)
module.exports=coupon