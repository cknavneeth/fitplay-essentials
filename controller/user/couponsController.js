const { User, addressSchema } = require("../../models/userModel.js");
const env = require("dotenv").config();
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const Product = require("../../models/productModel.js");
const Category = require("../../models/categoryModel.js");
const Coupon= require("../../models/couponModel.js");
const jwt = require("jsonwebtoken");
const statusCodes = require("../../config/keys.js");
const crypto = require("crypto");
const Cart = require("../../models/cartModel.js");

// exports.applyCoupon=async(req,res)=>{
//     try {
//         const {couponCode}=req.body
//         const userId=req.user.id
//         const user=await User.findById(userId)

//         console.log('annan',user)


//         const coupon=await Coupon.findOne({code:couponCode,isActive:true})
//         if(!coupon){
//             return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'invalid coupon'})
//         }
//        console.log('coupon ahneeyyy',coupon)
//         if(coupon.expirationDate<new Date()){
//             return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'This coupon is expired'})
//         }

//         console.log("Type of coupon._id:", typeof coupon._id); // Should ideally be 'object' if it's an ObjectId
// console.log("Type of entry.coupon:", typeof user.couponsUsed[0].coupon); // Check type of `coupon` in an entry

        
//         // const usedCoupon=user.couponsUsed.find(
//         //     (entry)=>entry.coupon.toString()==coupon._id.toString()
//         // )
//         const usedCoupon = user.couponsUsed.find(
//             (entry) => entry.coupon.equals(coupon._id)
//           );
          
//         console.log('hhhhhhh',usedCoupon)
//         //checking per user limit
//         if(usedCoupon&&usedCoupon.usageCount>=coupon.perUserLimit){
//             return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'you are already reached the limit of this coupon'})
//         }

//         //checking the total usage limit
//         if(coupon.usageLimit&&coupon.usedCount>=coupon.usageLimit){
//             return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'coupon usage limit reached'})
//         }

//         const cart=await Cart.findOne({userId})
//         console.log('ggggvvvvkkkk',cart)
//         if(!cart){
//             return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'cart not found'})
//         }

//         let discountAmount;
//         if(coupon.discountType==="percentage"){
//             discountAmount=(coupon.discountAmount/100)*cart.totalPrice
//         }else if(coupon.discountType==="fixed"){
//             discountAmount=coupon.discountAmount
//         }

       


//         if(coupon.maxDiscount&&discountAmount>coupon.maxDiscount){
//             discountAmount=coupon.maxDiscount
//         }
//         cart.discount=discountAmount
//         cart.couponCode=couponCode
//         console.log("pushpaaaaa",cart.couponCode)
//         cart.grandTotal=cart.totalPrice-discountAmount
//         console.log('hemme',cart.grandTotal)


//         if(usedCoupon){
//             usedCoupon.usageCount+=1
//         }else{
//             user.couponsUsed.push({coupon:coupon._id,usageCount:1})
//         }

//         coupon.usedCount+=1

//         await cart.save()
//         await coupon.save()

//         res.json({success:true,discountAmount,grandTotal: cart.grandTotal})


//     } catch (error) {
//         console.error(error)
//     }
// }