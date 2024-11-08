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
//         user.couponsUsed.forEach(entry => {
//             console.log(`Coupon in couponsUsed: ${entry.coupon.toString()}, usageCount: ${entry.usageCount}`);
//         });


//         // const usedCoupon = user.couponsUsed.find(
//         //     (entry) => entry.coupon.equals(coupon._id)
//         //   );
          
//         const totalUsageCount = user.couponsUsed
//         .filter(entry => entry.coupon.equals(coupon._id))
//         .reduce((acc, entry) => acc + entry.usageCount, 0);

//     // Check per-user limit
//         if (totalUsageCount >= coupon.perUserLimit) {
//            return res.status(400).json({ success: false, error: 'You have reached the usage limit for this coupon' });
//         }

//         console.log('hhhhhhh',totalUsageCount)
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
// exports.applyCoupon = async (req, res) => {
//     try {
//         const { couponCode } = req.body;
//         const userId = req.user.id;
//         const user = await User.findById(userId);
//         console.log('User:', user);

//         // Find the coupon in the database
//         const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
//         if (!coupon) {
//             return res.status(400).json({ success: false, error: 'Invalid coupon' });
//         }
//         console.log('Coupon:', coupon);

//         // Check if the coupon is expired
//         if (coupon.expirationDate < new Date()) {
//             return res.status(400).json({ success: false, error: 'This coupon is expired' });
//         }

//         // Calculate total usage count for this coupon by the user
//         const totalUsageCount = user.couponsUsed
//             .filter(entry => entry.coupon.equals(coupon._id))
//             .reduce((acc, entry) => acc + entry.usageCount, 0);

//         // Check per-user limit
//         if (totalUsageCount >= coupon.perUserLimit) {
//             return res.status(400).json({ success: false, error: 'You have reached the usage limit for this coupon' });
//         }

//         // Check total usage limit
//         if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
//             return res.status(400).json({ success: false, error: 'Coupon usage limit reached' });
//         }

//         // Find the user's cart
//         const cart = await Cart.findOne({ userId });
//         if (!cart) {
//             return res.status(400).json({ success: false, error: 'Cart not found' });
//         }

//         // Calculate discount amount based on the coupon type
//         let discountAmount;
//         if (coupon.discountType === "percentage") {
//             discountAmount = (coupon.discountAmount / 100) * cart.totalPrice;
//         } else if (coupon.discountType === "fixed") {
//             discountAmount = coupon.discountAmount;
//         }

//         // Apply max discount limit if set
//         if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
//             discountAmount = coupon.maxDiscount;
//         }
//         // cart.discount = discountAmount;
//         // cart.couponCode = couponCode;
//         // cart.grandTotal = cart.totalPrice - discountAmount;
//         const updatedTotalPrice = cart.totalPrice - discountAmount;
//         cart.discount = discountAmount;
//         cart.couponCode = couponCode;
//         cart.grandTotal = updatedTotalPrice;

//         // Update usage count for this coupon
//         const existingEntry = user.couponsUsed.find(entry => entry.coupon.equals(coupon._id));
//         if (existingEntry) {
//             existingEntry.usageCount += 1;
//         } else {
//             user.couponsUsed.push({ coupon: coupon._id, usageCount: 1 });
//         }

//         // Increment the global usage count for the coupon
//         coupon.usedCount += 1;

//         // Save changes
//         await cart.save();
//         await coupon.save();
//         await user.save();

//         res.json({ success: true, discountAmount, grandTotal: cart.grandTotal,totalPrice: cart.totalPrice,
//             items: cart.items  });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, error: 'Internal server error' });
//     }
// };


exports.applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        const userId = req.user.id;
        const user = await User.findById(userId);

        const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
        if (!coupon) {
            return res.status(400).json({ success: false, error: 'Invalid coupon' });
        }

        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart) {
            return res.status(400).json({ success: false, error: 'Cart not found' });
        }

        
        if (cart.couponCode) {
            return res.status(400).json({ success: false, error: 'You have already used a coupon for this cart. Please add new products to apply a coupon again.' });
        }
        console.log('balalu',cart.couponCode)

        if(cart.totalPrice<coupon.minPurchaseAmount){
            return res.status(statusCodes.BAD_REQUEST).json({success:false,error:`Minimum purchase amount of ${coupon.minPurchaseAmount} is required to apply this coupon` })
        }


       

        if (coupon.expirationDate < new Date()) {
            return res.status(400).json({ success: false, error: 'This coupon is expired' });
        }

        const totalUsageCount = user.couponsUsed
            .filter(entry => entry.coupon.equals(coupon._id))
            .reduce((acc, entry) => acc + entry.usageCount, 0);

        if (totalUsageCount >= coupon.perUserLimit) {
            return res.status(400).json({ success: false, error: 'You have reached the usage limit for this coupon' });
        }

        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ success: false, error: 'Coupon usage limit reached' });
        }

       

        let discountAmount;
        if (coupon.discountType === "percentage") {
            discountAmount = (coupon.discountAmount / 100) * cart.totalPrice;
        } else if (coupon.discountType === "fixed") {
            discountAmount = coupon.discountAmount;
        }

        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
            discountAmount = coupon.maxDiscount;
        }
        
        const discountPerItem = discountAmount / cart.items.length;
        
        cart.discount = discountAmount;
        cart.couponCode = couponCode;
        cart.grandTotal = cart.totalPrice - discountAmount;
        
        

      
        const updatedItems = cart.items.map(item => {
            const updatedPrice = item.price - discountPerItem / item.quantity;
            const updatedTotalPrice = updatedPrice * item.quantity;
            return {
                ...item.toObject(),
                price: updatedPrice,
                totalPrice: updatedTotalPrice
            };
        });
        cart.items = updatedItems;

        const existingEntry = user.couponsUsed.find(entry => entry.coupon.equals(coupon._id));
        if (existingEntry) {
            existingEntry.usageCount += 1;
        } else {
            user.couponsUsed.push({ coupon: coupon._id, usageCount: 1 });
        }

        coupon.usedCount += 1;

        await cart.save();
        await coupon.save();
        await user.save();

        res.json({ success: true, discountAmount, grandTotal: cart.grandTotal, items: updatedItems });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};


exports.gettingCoupon=async(req,res)=>{
    try {
        const coupons=await Coupon.find({isActive:true})
        res.json(coupons)
    } catch (error) {
        console.error(error)
    }
}