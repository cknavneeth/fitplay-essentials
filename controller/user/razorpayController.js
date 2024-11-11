// const Razorpay=require('razorPay')
// const Cart=require('../../models/cartModel')
// const statusCodes = require("../../config/keys.js");

// const razorpay=new Razorpay({
//     key_id: process.env.RAZORPAY_ID, 
//     key_secret: process.env.RAZORPAY_SECRET, 
// })
// //
// exports.createOrder=async(req,res)=>{
//     const {address,paymentMethod}=req.body
//     const userId=req.user.id

//     try {
//         const cart=await Cart.findOne({userId})

//         if(!cart||cart.items.length===0){
//             return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'cart not found'})
//         }
//         console.log('ithonn noku',cart.grandTotal)

//         const amount=cart.grandTotal*100

//         const order=await razorpay.orders.create({
//             amount:amount,
//             currency:"INR",
//             receipt:`order_rcptid_${new Date().getTime()}`
//         })


//         res.json({
//             success:true,
//             orderId:order.id,
//             amount: amount,
//         })
//     } catch (error) {
//         console.error('Razorpay order creation failed:', error);
//         res.json({ success: false, error: 'Unable to create Razorpay order' });
//     }
// }