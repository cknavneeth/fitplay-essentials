const Cart=require('../../models/cartModel')
const User=require('../../models/userModel')
const Product = require("../../models/productModel.js");
const Category=require('../../models/categoryModel.js')
const jwt = require("jsonwebtoken");
const statusCodes=require('../../config/keys.js')

exports.getCartPage=async(req,res)=>{
    try {
        const id=req.user.id
        const user=await User.findById(id)
        res.render('user/cart',{user})
    } catch (error) {
        console.error(error)
    }
}


exports.addToCart=async(req,res)=>{
    const {productId,size}=req.body
    const userId=req.user.id
    try {
        const product=await Product.findById({_id:productId})
        if(!product){
            return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'product not found'})
        }


        let cart=await Cart.findOne({userId})
        if(!cart){
            cart=new Cart({userId,items:[]})
        }

        // if(!cart.items){
        //     cart.items=[]
        // }

        const existingItem=await cart.items.find(
            item=>item.productId.equals(productId)&&item.size===size
        )

        const price=product.salePrice
        const totalPrice=price

        if(existingItem){
            existingItem.quantity+=1
            existingItem.totalPrice=existingItem.quantity*price
        }else{
            // cart.items.push({userId,size,quantity:1,price,totalPrice})
            const newItem = {
                productId: productId,
                size: size,
                quantity: 1,
                price: price,
                totalPrice: totalPrice
              };
        
              console.log("New Item to Add:", newItem);
        
              cart.items.push(newItem);
        }

        await cart.save()
        res.json({success:true})
    } catch (error) {
        console.error(error)
        return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'internal server error'})
    }
}