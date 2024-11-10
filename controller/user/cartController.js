const Cart=require('../../models/cartModel')
const mongoose = require('mongoose');
const { User, addressSchema } = require("../../models/userModel.js"); 
const Order=require('../../models/orderModel.js')
const Product = require("../../models/productModel.js");
const Category=require('../../models/categoryModel.js')
const Coupon=require('../../models/couponModel.js')
const jwt = require("jsonwebtoken");
const statusCodes=require('../../config/keys.js')


exports.getCartPage=async(req,res)=>{
    try {
        const userId=req.user.id
        const user=await User.findById(userId)

        const cart=await Cart.findOne({userId}).populate('items.productId')
        console.log("cart:",cart);
        
        // if(!cart||cart.items.length==0){
        //       return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'Cart is empty'})
        // }

        const cartEmpty=!cart||cart.items.length==0
        if(cartEmpty){
           return res.render('user/cart', { 
            user,
             cart:cart? cart:[], 
             total: 0,
             discountAmount:0,
             couponCode:'',
             grandTotal:0,
             cartEmpty:true} )
        }

        const cartTotal=cart.items.reduce((total,item)=>total+item.totalPrice,0)


        const discountAmount=cart.discountAmount||0
        const couponCode=cart.couponCode||''
        const grandTotal=cartTotal-discountAmount
       
        console.log("babloo",cart.items)
        res.render('user/cart', { user,
             cart:cart? cart:[],
              total: cartTotal,
               discountAmount,
               couponCode,
               grandTotal:cart.grandTotal,
               cartEmpty:false});
               console.log('jijo shibu',grandTotal)

    } catch (error) {
        console.error(error)
    }
}



exports.addToCart = async (req, res) => {
    const { productId, size } = req.body;
    console.log(req.body)
    const userId = req.user.id;

    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(400).json({ success: false, error: 'Product not found' });
        }

        const sizeObject=product.sizes.find(s=>s.size===size)
        if(!sizeObject){
            return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'size is not found for this product'})
        }


        const stock=sizeObject.stock
        console.log(stock)



        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        console.log("Request Product ID:", productId.toString());
console.log("Cart Items:", cart.items.map(item => ({ id: item.productId.toString(), size: item.size })));

       
        
        const existingItemIndex = cart.items.findIndex(
            item => item.productId.toString() === productId && item.size === size
        );
        
        console.log("Existing item index:", existingItemIndex);

        const price = product.salePrice;
        
        
       

        if (existingItemIndex > -1) {
            
            const existingItem = cart.items[existingItemIndex];

            if(existingItem.quantity+1>stock){
                return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'Quantity exceeds available stock'})
            }
            existingItem.quantity += 1;
            existingItem.totalPrice = existingItem.quantity * existingItem.price;
            console.log("Updated existing item:", existingItem);
            // await existingItem.save()
        } else {
           if(1>stock){
            return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'Quantity exceeds available stock'})
           }
            const newItem = {
                productId,
                size,
                quantity: 1,
                price: price,
                totalPrice: price,
            };

            cart.items.push(newItem);
            
        }

        const subtotal=cart.items.reduce((sum,item)=>sum+item.totalPrice,0)
        cart.subTotal=subtotal
        cart.grandTotal=subtotal
         
        // cart.isCouponApplied = false;
     
        console.log("SubTotal ahne:", cart.subTotal); 
        console.log("GrandTotal ahne:", cart.grandTotal);




        let discountAmount = 0;
        if (cart.isCouponApplied && cart.couponCode) {
            const coupon = await Coupon.findOne({ code: cart.couponCode, isActive: true });
            if (coupon) {
                if (coupon.discountType === 'percentage') {
                    discountAmount = (coupon.discountAmount / 100) * subtotal;
                } else if (coupon.discountType === 'fixed') {
                    discountAmount = coupon.discountAmount;
                }
                if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                    discountAmount = coupon.maxDiscount;
                }
                cart.discount = discountAmount;
            } else {
                
                cart.isCouponApplied = false;
                cart.couponCode = null;
                cart.discount = 0;
            }
        }

        
        cart.grandTotal = subtotal - discountAmount;






        await cart.save();
        res.json({ success: true, message: 'Cart updated successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};


exports.deleteProductCart=async(req,res)=>{
    try {
        const {id:itemId}=req.params
        const userId=req.user.id

        const cart=await Cart.findOne({userId})

        if(!cart){
            return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'cart not found'})
        }
      

        // cart.items = cart.items.filter(item => item.productId.toString() !== productId);

        cart.items=cart.items.filter(item=>item._id.toString()!==itemId)


        cart.subTotal=cart.items.reduce((sum,items)=>sum+items.totalPrice,0)
        cart.grandTotal=cart.subTotal

        await cart.save();
        res.redirect('/cart')
    } catch (error) {
        console.error(error)
    }
}




//for check out page
exports.checkoutPage=async(req,res)=>{
    try {
        const userId=req.user.id
        
        const user = await User.findById(userId);

        const cart=await Cart.findOne({userId}).populate("items.productId")
        
        if(!cart){
            return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'cart not found'})
        }
        
        const cartItems=cart.items.map((item)=>({
            productName:item.productId.productName,
            image:item.productId.productImage[0],
            quantity:item.quantity,
            price:item.productId.salePrice,
            totalPrice:item.quantity*item.productId.salePrice

        }))
         const subTotal=cartItems.reduce((sum,item)=>sum+item.totalPrice,0)

         const discount=cart.discount||0

         const grandTotal=subTotal-discount
        const addresses=user.addresses.filter(address=>!address.deleted)
       
        res.render('user/checkout',{cartItems,user,addresses,subTotal,grandTotal,discount,couponCode:cart.couponCode||null})
    } catch (error) {
        console.error(error)
    }
}


exports.checkoutAddressPage=async(req,res)=>{
    
        const userId=req.user.id
        console.log(userId)
        const user = await User.findById(userId);
        
       res.render('user/check-addaddress',{user})
    
}

exports.checkoutaddressSave=async(req,res)=>{
    const{name,mobile,pincode,locality,address,state,city,landmark,alternate_phone,address_type}=req.body

    try {
        const userId=req.user.id
        const user=await User.findById(userId)

        if(!user){
            return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'user not found'})
        }

        user.addresses.push({
            name,
            mobile,
            pincode,
            locality,
            address,
            state,
            city,
            landmark,
            alternate_phone,
            address_type
        })
        await user.save()
        res.redirect('/checkout')
    } catch (error) {
        console.error(error)
    }
}


exports.checkoutaddressEdit=async(req,res)=>{
    const userId=req.user.id
    const user=await User.findById(userId)
    const addressId=req.params.addressId
    try {

        const address=user.addresses.id(addressId)
        if(!address){
            return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'address not found'})
        }
        res.render('user/check-editadd',{user,address})
    } catch (error) {
        console.error(error)
    }
}

exports.checkouteditSave=async(req,res)=>{
    const{name,mobile,pincode,locality,address,state,city,landmark,alternate_phone,address_type}=req.body
    const addressId=req.params.addressId
    try {
        const user=await User.findOne({'addresses._id':addressId})

        if(user&&user.addresses.length>0){
            const addressupdate=user.addresses.id(addressId)
            if(addressupdate){
                addressupdate.name=name,
                addressupdate.mobile=mobile,
                addressupdate.pincode=pincode,
                addressupdate.locality=locality,
                addressupdate.address=address,
                addressupdate.state=state,
                addressupdate.city=city,
                addressupdate.landmark=landmark,
                addressupdate.alternate_phone=alternate_phone,
                addressupdate.address_type=address_type

                await user.save()
                res.redirect('/checkout')
            }else{
                return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'address not found'})
            }
        }else{
            return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'user not found'})
        }
    } catch (error) {
        console.error(error)
    }
}







exports.handleCod=async(req,res)=>{
    try {
        const userId=req.user.id
        
        const{paymentMethod,address:selectedAddressId}=req.body
        console.log('paymentmethod',paymentMethod)
        if(!paymentMethod){
            return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'invalid payment method'})
        }
        const [cart, user] = await Promise.all([
             Cart.findOne({ userId }).populate({
                path: 'items.productId',
                model: 'Product'
            }),
            
            User.findById(userId).lean()
        ]);
        console.log("ithan ente cart",cart.items)

        const selectedAddress=user.addresses.find(address=>address._id.toString()===selectedAddressId)

        if(!selectedAddressId){
            return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'invalid address'})
        }

        if(!cart||!cart.items||cart.items.length==0){
            return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'cart is empty'})
        }
        
        let totalAmount=0
        let totalQuantity=0
        const products=[]

        for(const item of cart.items){
           const{productId,size,price,quantity}=item;
           const sizeStock=productId.sizes.find(s=>s.size===size)

           if(!sizeStock||sizeStock.stock<quantity){
            return res.status(statusCodes.BAD_REQUEST).json({success:false,error:`${productId.productName} (${size}) has insufficient stock. Only ${sizeStock ? sizeStock.stock : 0} left.`})
           }
        

        totalAmount+=price*quantity
        totalQuantity+=quantity
        products.push({
            product:productId._id,
            size,
            quantity,
            price
        })
    }

    console.log("hashim aju",products)

    const items=cart.items.map(item=>({
        productId:item.productId._id,
        productName:item.productId.productName,
        image:item.productId.productImage[0],
        price:item.price,
        quantity:item.quantity,
        totalPrice:item.price*item.quantity,
        

    }))

        const orderId = await getNextOrderId();

        const newOrder=new Order({
            user:userId,
            oid:orderId,
            items,
            totalAmount,
            paymentMethod,
            status:'Processing',
            totalQuantity,
            address: {
                name: selectedAddress.name,
                mobile: selectedAddress.mobile,
                pincode: selectedAddress.pincode,
                locality: selectedAddress.locality,
                address: selectedAddress.address,
                city: selectedAddress.city,
                state: selectedAddress.state,
                landmark: selectedAddress.landmark,
                alternate_phone: selectedAddress.alternate_phone,
                address_type: selectedAddress.address_type
            }

        })

        await newOrder.save()

        for(const item of products){
            const product=await Product.findOne(item.product)
            const sizeStock=product.sizes.find(s=>s.size===item.size)
            if(sizeStock){
                sizeStock.stock-=item.quantity
            }
            await product.save()
        }

        await Cart.findByIdAndDelete(cart._id);


        res.json({success:true,error:'Order updated successfully',cartEmpty:true,orderId:newOrder._id})


    } catch (error) {
        console.error(error)
        return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({success:false,error:'internal server error'})
    }
}

async function getNextOrderId() {
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${randomSuffix}`;
}


exports.getmyOrders=async(req,res)=>{
    try {
        const userId=req.user.id
        const user=await User.findById(userId)
        const orders=await Order.find({user:userId}).populate('items.productId')
        res.render('user/myOrders',{user,orders})
    } catch (error) {
        console.error(error)
    }
}

//cancel order
// exports.cancelOrder=async(req,res)=>{
//     try {
//         const orderId=req.params.orderId
//         const updateOrder=await Order.findByIdAndUpdate(orderId,{orderStatus:'Cancelled'},{new:true})
//         if(!updateOrder){
//              return res.json({success:false,error:'order not found'})
//         }

//         for(let item of updateOrder.items){
//             const product=await Product.findOne(item.product)

//             if(product){
//                 const sizeStock=product.sizes.findIndex(s=>s.size===item.size)

//                 if(sizeStock!==-1){
//                     product.sizes[sizeStock].stock+=item.quantity
//                     console.log(`Updated stock for size ${item.size} by ${item.quantity}`);
//                 }
    
//                 await product.save()
//             }

          

//         }
//         res.json({success:true,error:'order successfully cancelled!'})
//     } catch (error) {
//         res.json({success:false,error:'error cancelling order'})
//     }
// }


exports.cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;

        // Find and update the order status to 'Cancelled'
        const updateOrder = await Order.findByIdAndUpdate(
            orderId,
            { orderStatus: 'Cancelled' },
            { new: true }
        );

        if (!updateOrder) {
            return res.json({ success: false, error: 'Order not found' });
        }

        // Loop through each item in the canceled order to restore stock
        for (const item of updateOrder.items) {
            console.log("Processing item:", item);  // Log item details for debugging

            // Check if item.size is defined
            if (!item.size) {
                console.log(`Size is undefined for item with product ID: ${item.productId}`);
                continue;
            }

            // Fetch the product by ID
            const product = await Product.findById(item.productId);

            if (product) {
                // Find the specific size in the product's sizes array
                const sizeIndex = product.sizes.findIndex(s => s.size === item.size);

                if (sizeIndex !== -1) {
                    // Increase the stock for this size by the quantity in the canceled order
                    product.sizes[sizeIndex].stock += item.quantity;
                } else {
                    console.log(`Size ${item.size} not found in product ${item.productId}`);
                }

                // Save the updated product with the restored stock
                await product.save();
            } else {
                console.log(`Product with ID ${item.productId} not found`);
            }
        }

        res.json({ success: true, message: 'Order successfully cancelled and stock updated!' });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ success: false, error: 'Error cancelling order' });
    }
};



