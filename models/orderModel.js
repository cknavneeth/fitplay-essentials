const mongoose=require('mongoose')

const addressSchema=require('./userModel').addressSchema

const orderSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    oid: { type: String, required: true },
    items:[
        {
            productId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:'Product',
                required:true
            },
            productName:{
                type:'String',
                required:true
            },
            image:{
                type:'String',
                required:true
            },
            quantity:{
                type:Number,
                required:true
            },
            price:{
                type:Number,
                required:true
            },
            totalPrice:{
                type:Number,
                required:true
            },
            size: {  // Add the size field here
                type: String,
                required: true
            }
           
        }
    ],
    address:addressSchema,
    productOffer:{type:Number,required:true},
    grandTotal: { type: Number, required: true },
    discount:{type:Number,required:true},
    paymentMethod: { type: String, required: true },
    paymentStatus: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' },
    orderStatus: { type: String, enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled','Returned'], default: 'Processing' },
    totalAmount: { type: Number, required: true },
    orderDate: { type: Date, default: Date.now }
})

orderSchema.pre('save',function(next){
    const amount=this.items.reduce((acc,curr)=>acc+curr.totalPrice,0)
    this.totalAmount=amount
    next()
})

const order=mongoose.model('order',orderSchema)

module.exports=order