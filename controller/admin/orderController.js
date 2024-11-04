const Product=require('../../models/productModel.js')
const Category=require('../../models/categoryModel.js')
const Order=require('../../models/orderModel.js')
const User=require('../../models/userModel.js')
const fs=require("fs")
const path=require("path")
const sharp=require("sharp")
const statusCodes=require('../../config/keys.js')

exports.getOrderPage = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; 
        const limit = parseInt(req.query.limit) || 7; 
        const skip = (page - 1) * limit;

        
        const totalOrders = await Order.countDocuments();
        const totalPages = Math.ceil(totalOrders / limit);

        
        const orders = await Order.find()
            .populate('user')
            .populate('items.productId')
            .skip(skip)
            .limit(limit);

        
        res.render('admin/orders', { orders, currentPage: page, totalPages, limit });
    } catch (error) {
        console.error('Error fetching orders', error);
        res.status(500).send('Internal Server Error');
    }
};



// exports.getOrderPage=async(req,res)=>{
//     try {
//         const orders=await Order.find().populate('user').populate('items.productId')
//         res.render('admin/orders',{orders})
//     } catch (error) {
//         console.error('error fetching orders',error)
//     }
// }

exports.cancelOrderAdmin=async(req,res)=>{
    try {
        const orderId=req.params.orderId
        const updateOrder=await Order.findByIdAndUpdate(orderId,{orderStatus:'Cancelled'},{new:true})
        if(!updateOrder){
            return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'order not found'})
        }
        res.json({success:true,error:'Order cancelled ayitund'})
    } catch (error) {
        console.error(error)
    }
}


exports.updateStatus=async(req,res)=>{
    try {
        const orderId=req.params.orderId
        const {status}=req.body
        console.log(orderId)
        console.log("jijo",status)

        const order = await Order.findByIdAndUpdate(orderId, { orderStatus: status }, { new: true });


        if(!order){
            return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'status not found'})
        }
        res.json({success:true,error:'Status updated successfully'})
    } catch (error) {
        console.error("error ahnello",error)
        return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'error occured do something immidiately'})
    }
}