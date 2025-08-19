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
        const page=req.query.page||1
        const limit=req.query.limit||5
        const skip=(page-1)*limit
        const totalDocuments=await Coupon.countDocuments()
        const totalPages=Math.ceil(totalDocuments/limit)
        const coupons=await Coupon.find().sort({_id:-1})
        .skip(skip)
        .limit(limit)
        res.render('admin/coupon',
            {
                coupons,
                totalPages,
                totalDocuments,
                currentPage: page,
                limit
            })
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

        if(minPurchaseAmount<discountAmount){
            return res.status(status.BAD_REQUEST).json({success:false,error:'Discount amount must be lesser than minimum purchase amount'})
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



exports.deleteCoupon=async(req,res)=>{
    try {
        const id=req.params.couponId
        const coupon=await Coupon.findByIdAndDelete(id)
        if(!coupon){
            return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'coupon not found'})
        }

        res.json({success:true,error:'Coupon deleted successfully'})
    } catch (error) {
        console.error(error)
        return res.status(statusCodes).json({success:false,error:'error while deleting'})
    }
}


exports.editCoupon=async(req,res)=>{
    try {
        const id=req.params.couponId

        const coupon=await Coupon.findById(id)
        if(!coupon){
            return res.status(statusCodes.BAD_REQUEST).json({success:false,error:"coupon not found"})
        }

        res.render('admin/editCoupon',{coupon})
    } catch (error) {
        console.error(error)   
     }
}


exports.postEditCoupon=async(req,res)=>{
    try {
        const{couponId}=req.params
        const {
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


        const existingCoupon=await Coupon.findOne({code,_id:{$ne:couponId}})
        if(existingCoupon){
            // return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'This coupon already exists,please add another'})
            return res.redirect(`/editCoupon/${couponId}?error=This coupon already exists, please add another`);

        }

        await Coupon.findByIdAndUpdate(couponId,{
            code,
            discountType,
            discountAmount,
            minPurchaseAmount,
            expirationDate:new Date(expirationDate),
            maxDiscount:maxDiscount||null,
            usageLimit:usageLimit||null,
            perUserLimit:perUserLimit||null,
            isActive:isActive==='true'

        })

      

        res.redirect('/adminCoupons')
    } catch (error) {
        console.error(error)
    }
}