const Cart=require('../../models/cartModel')
const User=require('../../models/userModel')
const Product = require("../../models/productModel.js");
const Category=require('../../models/categoryModel.js')
const jwt = require("jsonwebtoken");
const statusCodes=require('../../config/keys.js')

exports.getCartPage=async(req,res)=>{
    try {
        const userId=req.user.id
        const user=await User.findById(userId)

        const cart=await Cart.findOne({userId}).populate('items.productId')
        console.log("cart:",cart);
        
        if(!cart||cart.items.length==0){
              return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'Cart is empty'})
        }

        const cartTotal=cart.items.reduce((total,item)=>total+item.totalPrice,0)

        // res.json({success:true,cart:{cart:cart.items,total:cartTotal}})
        console.log("babloo",cart.items)
        res.render('user/cart', { user, cart:cart? cart:[], total: cartTotal });

    } catch (error) {
        console.error(error)
    }
}


// exports.addToCart=async(req,res)=>{
//     const {productId,size}=req.body
//     const userId=req.user.id
//     try {
//         const product=await Product.findById({_id:productId})
//         if(!product){
//             return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'product not found'})
//         }


//         let cart=await Cart.findOne({userId})
//         if(!cart){
//             cart=new Cart({userId,items:[]})
//         }

//         // if(!cart.items){
//         //     cart.items=[]
//         // }

//         const existingItemIndex= cart.items.findIndex(
//             item=>item.productId.toString()===productId&&item.size===size
//         )

//         const price=product.salePrice
//         const totalPrice=price

//         if(existingItemIndex>-1){
//             // cart.items[existingItemIndex].quantity+=1
//             // cart.items[existingItemIndex].totalPrice+=cart.items[existingItemIndex].price
//             const existingItem = cart.items[existingItemIndex];
//             existingItem.quantity += 1;
//             existingItem.totalPrice = existingItem.quantity * existingItem.price;
//         }else{
//             // cart.items.push({userId,size,quantity:1,price,totalPrice})
//             const newItem = {
//                 productId: productId,
//                 size: size,
//                 quantity: 1,
//                 price: price,
//                 totalPrice: totalPrice
//               };
        
//               console.log("New Item to Add:", newItem);
        
//               cart.items.push(newItem);
//         }

//         await cart.save()
//         res.json({success:true})
//     } catch (error) {
//         console.error(error)
//         return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'internal server error'})
//     }
// }
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
            console.log("shahal")
            const existingItem = cart.items[existingItemIndex];

            if(existingItem.quantity+1>stock){
                return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'Quantity exceeds available stock'})
            }
            existingItem.quantity += 1;
            existingItem.totalPrice = existingItem.quantity * existingItem.price;
            console.log("Updated existing item:", existingItem);
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
                // image: product.productImage[0]
            };

            cart.items.push(newItem);
            console.log("New item added:", cart.items[cart.items.length - 1]);
        }

        const subtotal=cart.items.reduce((sum,item)=>sum+item.totalPrice,0)
        cart.subTotal=subtotal
        cart.grandTotal=subtotal

        console.log('fuck offff',cart)
        console.log("SubTotal ahne:", cart.subTotal); 
console.log("GrandTotal ahne:", cart.grandTotal);

        await cart.save();
        res.json({ success: true, message: 'Cart updated successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};


exports.deleteProductCart=async(req,res)=>{
    try {
        const {id:productId}=req.params
        const userId=req.user.id

        const cart=await Cart.findOne({userId})

        if(!cart){
            return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'cart not found'})
        }
      

        cart.items = cart.items.filter(item => item.productId.toString() !== productId);


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
        const user=await User.findById(userId)

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

        const addresses=user.addresses.filter(address=>!address.deleted)
       
        res.render('user/checkout',{cartItems,user,addresses})
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


