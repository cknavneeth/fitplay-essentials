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

        if(!cart||cart.items.length==0){
              return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'Cart is empty'})
        }

        const cartTotal=cart.items.reduce((total,item)=>total+item.totalPrice,0)

        // res.json({success:true,cart:{cart:cart.items,total:cartTotal}})
        res.render('user/cart', { user, cart:cart? cart.items:[], total: cartTotal });

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
            console.log(existingItem)
            existingItem.quantity += 1;
            existingItem.totalPrice = existingItem.quantity * existingItem.price;
            console.log("Updated existing item:", existingItem);
        } else {
            // Add new item to cart
            const newItem = {
                productId,
                size,
                quantity: 1,
                price: price,
                totalPrice: price
            };

            cart.items.push(newItem);
            console.log("New item added:", cart.items[cart.items.length - 1]);
        }

        const subtotal=cart.items.reduce((sum,item)=>sum+item.totalPrice,0)
        cart.subTotal=subtotal
        cart.grandTotal=subtotal

        await cart.save();
        res.json({ success: true, message: 'Cart updated successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};




