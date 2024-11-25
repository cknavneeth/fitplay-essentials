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







exports.applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        const userId = req.user.id;
        const user = await User.findById(userId);

        const coupon = await Coupon.findOne({ code: {$regex:new RegExp(couponCode,'i')}, isActive: true ,});
        if (!coupon) {
            return res.status(400).json({ success: false, error: 'Invalid coupon' });
        }

        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart) {
            return res.status(400).json({ success: false, error: 'Cart not found' });
        }

        
        if (cart.couponCode) {
            return res.status(400).json({ success: false, error: 'You have already used a coupon for this cart.You cant again' });
        }
        console.log("bbruuhh",cart.couponCode)
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
        
        
        
        cart.discount = discountAmount;
        cart.couponCode = couponCode;
        cart.grandTotal = cart.totalPrice - discountAmount;
        
        
        console.log("Discount applied:", discountAmount);
        console.log("Updated grand total:", cart.grandTotal);
      

        console.log('thingss',cart.items)

        
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

        res.json({ success: true, discountAmount, grandTotal: cart.grandTotal, items: cart.items ,   couponCode: cart.couponCode,   discount:cart.discount});
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




exports.removeCoupon=async(req,res)=>{
    try {
        const userId=req.user.id

        const cart=await Cart.findOne({userId})

        if(!cart){
            return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'cart not found'})
        }
        if(!cart.couponCode){
            return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'No coupon is there to remove'})
        }
        cart.couponCode=null
        cart.discount=0
       
        cart.grandTotal = cart.subTotal;

        await cart.save();

        
        res.json({
            subTotal: cart.subTotal, 
            cartTotal: cart.cartTotal,
            grandTotal: cart.grandTotal 
        });

    } catch (error) {
        console.error(error)
    }
}