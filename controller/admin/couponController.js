const Product=require('../../models/productModel.js')
const Category=require('../../models/categoryModel.js')
const User=require('../../models/userModel.js')
const Coupon=require('../../models/couponModel.js')
const fs=require("fs")
const path=require("path")
const sharp=require("sharp")
const statusCodes=require('../../config/keys.js')
const { error } = require('console')


exports.getCoupons=async(req,res)=>{
    try {
        const coupons=await Coupon.find()
        res.render('admin/coupon',{coupons})
    } catch (error) {
        console.error(error)
    }
}

exports.getAddCoupon=async(req,res)=>{
    try {
        res.render('admin/addCoupon')
    } catch (error) {
        console.error(error)
    }
}

exports.addCoupon=async(req,res)=>{
    try {
        const{
            code,
            discountType,
            discountAmount,
            minPurchaseAmount,
            expirationDate,
            maxDiscount,
            usageLimit, 
            perUserLimit, 
            isActive 
        }=req.body

        if(!code||!discountType||!discountAmount||!minPurchaseAmount||!expirationDate){
            return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'required fields are missing'})
        }


        const formattedCode=code.toUpperCase()

        const existingCoupon =await Coupon.findOne({code:formattedCode})
        if(existingCoupon){
            return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'This coupon already exists'})
        }

        if(minPurchaseAmount<0&&discountAmount<0&&(maxDiscount&&maxDiscount<0)){
           return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'discountamount and minpurchases are must be greater than 0'})
        }

        const currentDate=new Date()
        if(new Date(expirationDate)<=currentDate){
            return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'expiration date must be in future'})
        }

        const newCoupon=new Coupon({
            code:formattedCode,
            discountType,
            discountAmount,
            minPurchaseAmount,
            expirationDate,
            maxDiscount:maxDiscount||null,
            usageLimit:usageLimit||null,
            perUserLimit:perUserLimit||null,
            isActive:isActive

        })

        await newCoupon.save()
        res.status(statusCodes.OK).json({success:true,error:'Coupon created successfully'})
    } catch (error) {
        console.error('Error creating coupon:', error);
        res.status(500).json({ success: false, message: 'Failed to create coupon' });
    }
}