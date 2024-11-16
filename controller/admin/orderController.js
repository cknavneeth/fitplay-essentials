const Product=require('../../models/productModel.js')
const Category=require('../../models/categoryModel.js')
const Order=require('../../models/orderModel.js')
const User=require('../../models/userModel.js')
const Wallet=require('../../models/walletModel.js')
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
            .limit(limit)
            .sort({orderDate:-1});

        
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


        ///wallet 
       
        //wallet
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

        //wallet
        
        if(status==='cancelled'&&order.paymentMethod==='wallet'){
            console.log('User ID:', order.user); 
            const wallet=await Wallet.findById(mongoose.Types.ObjectId(order.user))

            console.log('laluchayan',wallet)

            if(!wallet){
                return res.json({success:false,error:'wallet not found'})
            }
    
            wallet.balance+=order.grandTotal
            wallet.transaction.push({
                transactionType:'credit',
                amount:order.grandTotal,
                status:'completed'
            })
            await wallet.save()    
        }
       

        for(let item of order.items){
            const product =await Product.findById(item.productId)

            if(product){
                const sizeStock=product.sizes.find(s=>s.size===item.size)

                if(sizeStock){
                    sizeStock.stock+=item.quantity
                }
            }
            await product.save()
            
        }

        //wallet

        res.json({success:true,error:'Status updated successfully'})
    } catch (error) {
        console.error("error ahnello",error)
        return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'error occured do something immidiately'})
    }
}



exports.returnRequest=async(req,res)=>{
    try {
        const orderId=req.params.orderId
        const {action}=req.body

        const order=await Order.findById(orderId)

    if(!order||!order.returnRequest){
        return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'order not found or invalid return'})
    }


    if(action=='accept'){
        order.orderStatus = 'Returned';

        order.returnRequest=false

        const wallet=await Wallet.findOne({userId:order.user})

        if(wallet){
            wallet.balance+=order.grandTotal

            wallet.transaction.push({
                transactionType:'credit',
                amount:order.grandTotal,
                status:'completed'
            })
            await wallet.save()
        }

        for(const item of order.items){
            const product=await Product.findById(item.productId)

           
            if(product){
                const sizeStock=product.sizes.find(s=>s.size===item.size)
                if(sizeStock){
                    sizeStock.stock+=item.quantity
                }
            }
            await product.save()
           

        }
    }else if(action=='reject'){
          order.returnRequest=false
    }
    await order.save()
    return res.status(statusCodes.OK).json({success:true,error:'request ${action}ed successfully'})
    } catch (error) {
        console.error(error)
    }
}