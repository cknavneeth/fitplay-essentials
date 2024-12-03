const Wishlist = require("../../models/wishlistModel.js");
const Product = require("../../models/productModel.js");
const Category = require("../../models/categoryModel.js");
const jwt = require("jsonwebtoken");
const statusCodes = require("../../config/keys.js");
const crypto = require("crypto");
const { User, addressSchema } = require("../../models/userModel.js"); 



exports.getWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        const wishlist = await Wishlist.findOne({ userId })
        .populate({
            path: 'items.productId',
            model: 'Product',
            select: 'productName regularPrice salePrice productImage sizes'   
        })
        .exec();
    

        console.log("Populated wishlist:", wishlist); 
        res.render('user/wishlist', { user, wishlist: wishlist || { items: [] } });

    } catch (error) {
        console.error(error);
    }
};



exports.addtoWishlist=async(req,res)=>{
    try {
        const userId=req.user.id
        const productId=req.params.productId
        const { size, salePrice } = req.body;

        console.log("Product ID:", productId); 
  
        console.log("Selected Size:", size); 

       
        console.log("Type of salePrice:", typeof salePrice);  

        const user=await User.findById(userId)
        if(user.isBlocked===true){
            return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'you have no access'})
        }



        const product=await Product.findById(productId).exec()
        console.log("Fetched Product:", product);
        if(!product){
            return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'product not found'})
        }
        if (!product || !product.sizes) {
            return res.status(statusCodes.BAD_REQUEST).json({ success: false, error: 'Product or size information not available' });
        }
        const selectedSize = product.sizes.find(item => item.size === size);
        if(!selectedSize){
            return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'size not selected'})
        }

        let wishlist=await Wishlist.findOne({userId})
        if(!wishlist){
            wishlist=new Wishlist({userId,items:[]})
        }

       const existingProduct=wishlist.items.find(item=>item.productId.equals(productId)&&item.size==size)
       if(existingProduct){
        return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'product with this size already there'})
       }
        
        
            wishlist.items.push({
                productId,
                size: selectedSize.size,
                stock: selectedSize.stock,
                salePrice, 
            })
            await wishlist.save()
         return res.status(statusCodes.OK).json({success:true,error:'added to wishlist successfully'})
        

        // res.redirect('/wishlist')
    } catch (error) {
        console.error(error)
    }
}


exports.removefromWishlist=async(req,res)=>{
    try {
        const{productId,size}=req.body
        const userId=req.user.id
        const user=await User.findById(userId)
        if(!user){
            return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'user not found'})
        }

        const wishlist=await Wishlist.findOne({  userId })

        if(!wishlist){
            return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'wishlist not found'})
        }

        initialwishlistCount=wishlist.items.length
        wishlist.items=wishlist.items.filter(item=>item.productId.toString()!==productId||item.size!==size)
        if(initialwishlistCount==wishlist.items.length){
            return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'equal count'})
        }
        console.log('deleted successfully')
        await wishlist.save()
        return res.json({ success: true, message: 'Item removed from wishlist' });
    } catch (error) {
        console.error(error);
        
    }
}
// exports.removefromWishlist = async (req, res) => {
//     try {
//         const productId = req.params.productId;  // Getting the productId from the URL
//         const userId = req.user.id;  // Getting the userId from the authenticated user

//         // Find the user by userId
//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(400).json({ success: false, error: 'User not found' });
//         }

//         // Find the wishlist for the user
//         const wishlist = await Wishlist.findOne({  userId });
//         if (!wishlist) {
//             return res.status(400).json({ success: false, error: 'Wishlist not found' });
//         }

//         // Keep track of the initial wishlist count
//         const initialWishlistCount = wishlist.items.length;

//         // Remove the item by filtering out the productId
//         wishlist.items = wishlist.items.filter(item => item.productId.toString() !== productId);

//         // If the wishlist count hasn't changed, it means the item wasn't found
//         if (initialWishlistCount === wishlist.items.length) {
//             return res.status(400).json({ success: false, error: 'Item not found in wishlist' });
//         }

//         // Save the updated wishlist
//         await wishlist.save();

//         // Respond with success
//         return res.json({ success: true, message: 'Item removed from wishlist' });
//     } catch (error) {
//         console.error('Error in removefromWishlist:', error);
//         return res.status(500).json({ success: false, error: 'Something went wrong' });
//     }
// };
