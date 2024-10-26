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

        if(email&&email!==user.email){
            const emailExist=await User.findOne({email})
            if(emailExist){
                return res.status(statusCodes.BAD_REQUEST).json({success:false,error:"Email already exist"})
            }
        }
        if (newPassword) {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
        }
    
       

        user.username=name||user.username

        user.email=email||user.email

        
    
        await user.save()

        // res.redirect('/contact') 
        return res.status(200).json({ success: true, message: "Profile updated successfully" });
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
        const activeAddresses = user.addresses.filter(address => !address.deleted);

        res.render('user/address', { user: { ...user.toObject(), addresses: activeAddresses } });
       
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
                 return res.status(statusCodes.BAD_REQUEST).send('Address not found');
             }
        res.render('user/editAddress',{address,user})
    } catch (error) {
        console.error(error)
    }
 
}


exports.saveafterEdit=async(req,res)=>{
    try {
        const {id}=req.params;
        const{name,mobile,pincode,locality,address,state,city,landmark,alternate_phone,address_type}=req.body

        const user=await User.findOne({'addresses._id':id})      


        console.log('Address ID:', id); 
        console.log('User Found:', user); 
        if(user&& user.addresses.length > 0){
            const addressToUpdate=user.addresses.id(id)

            if(addressToUpdate){
                addressToUpdate.name = name;
                addressToUpdate.mobile = mobile;
                addressToUpdate.pincode = pincode;
                addressToUpdate.locality = locality;
                addressToUpdate.address = address;
                addressToUpdate.city = city;
                addressToUpdate.state = state;
                addressToUpdate.landmark = landmark;
                addressToUpdate.alternate_phone = alternate_phone;
                addressToUpdate.address_type = address_type;
            
            await user.save();
            res.redirect('/address')
            }
            else{
                return res.status(statusCodes.BAD_REQUEST).json({error:'address not found'})
            }
           

        }else{
           return res.status(statusCodes.BAD_REQUEST).json({error:'user not found'})
        }

    } catch (error) {
        console.error(err)
    }
}



exports.deleteAddress=async(req,res)=>{
    try {
        const addressId=req.params.id

        
        const result = await User.updateOne(
            { _id: req.user.id, 'addresses._id': addressId },
            { $set: { 'addresses.$.deleted': true } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ success: false, error: 'Address not found or not deleted' });
        }
        return res.status(200).json({ success: true, message: 'Address soft-deleted successfully' });
    } catch (error) {
        console.error(error)
        return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'error occured while deleting'})
    }
}