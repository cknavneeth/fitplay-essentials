const User = require("../../models/userModel.js");
const env = require("dotenv").config();
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const Product = require("../../models/productModel.js");
const Category=require('../../models/categoryModel.js')
const jwt = require("jsonwebtoken");
const statusCodes=require('../../config/keys.js')

exports.contact=async(req,res)=>{
    console.log("machan",req.user)
    const userId=req.user.id
    console.log(userId)
    const user = await User.findById(userId);
    res.render('user/contact',{user})
        
}

exports.profileUpdate=async(req,res)=>{

    try{
        const {name,email,password,newPassword,confirmPassword }=req.body
        console.log("padachone",password)
    
        const user=await User.findById(req.user.id)
    
        if(!user){
            return res.status(statusCodes.BAD_REQUEST).json({success:false,error:"user not found"})
        }
    
        const isMatch=await bcrypt.compare(password,user.password)
        if(!isMatch){
            return res.status(statusCodes.BAD_REQUEST).json({success:false ,error:"current password is incorrect"})
        }
    
        if(newPassword!==confirmPassword){
            return res.status(statusCodes.BAD_REQUEST).json({success:false,error:"password is not equal  "})
        }
    
        const hashedPassword=await bcrypt.hash(newPassword,10)

        user.username=name||user.username

        user.email=email||user.email

        user.password=hashedPassword
    
        await user.save()

        res.redirect('/contact') 
    }catch(err){
        console.error(err)
        return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({success:false,error:"internal server error"})
    }
   

}


exports.address=async(req,res)=>{
    try {
        const userId=req.user.id
        console.log(userId)
        const user = await User.findById(userId);
        res.render('user/address',{user})
    } catch (error) {
        console.error(error)
    }
}


exports.addressSave=async(req,res)=>{
    const userId=req.user.id
        console.log(userId)
        const user = await User.findById(userId);
   res.render('user/addressSave',{user})
}

exports.savingAddress=async(req,res)=>{
    const{name,mobile,pincode,locality,address,state,city,landmark,alternate_phone,address_type}=req.body
    try {
        const id=req.user.id

        const user=await User.findById(id)
    
        if(!user){
            return res.status(statusCodes.BAD_REQUEST).json({error:'user not found'})
        }
    
        user.addresses.push({
            name,
            mobile,
            pincode,
            locality,
            address,
            city,
            state,
            landmark,
            alternate_phone,
            address_type
        });
        await user.save();
        // res.status(statusCodes.OK).json({error:'address added successfully'})
        res.redirect('/address')
        
    } catch (error) {
        console.error(error)
    }
}


exports.editAddress=async(req,res)=>{
    try {
        const id =req.user.id
        const addressId = req.params.addressId;
        console.log("address vannitundeyyy",addressId)
        const user=await User.findById(id)
        if(!user){
         return res.status(statusCodes.BAD_REQUEST).json({error:'user not found'})
        }
        const address = user.addresses.id(addressId);
             if (!address) {
                 return res.status(404).send('Address not found');
             }
        res.render('user/editAddress',{address,user})
    } catch (error) {
        console.error(error)
    }
 
}
