const express = require("express");
const router = express.Router();
const userController = require("../controller/user/userController");
const profileController = require("../controller/user/profileController");
const cartController=require('../controller/user/cartController')
const {verifyUser}=require('../middleware/authMiddlware')
const {userLoggedIn}=require('../middleware/authMiddlware')
// const {protected}=require('../middleware/authMiddleware')
const passport=require('passport')
const jwt = require('jsonwebtoken');
const wishlistController=require('../controller/user/wishlistController')
const couponsController=require('../controller/user/couponsController')
const walletController=require('../controller/user/walletController')
const razorpayController=require('../controller/user/razorpayController')
const invoiceController=require('../controller/user/invoiceController')
const Order=require('../models/orderModel')
const Cart=require('../models/cartModel')
const {User}=require('../models/userModel')

console.log("hello")
router.get("/",(req, res) => {
  // res.render("user/signup", { error: null });
  res.redirect("/index");
});
router.get("/login",userLoggedIn,(req, res) => {
  res.render("user/login", { error: null });
});
router.get('/signup',(req,res)=>{
  res.render("user/signup", { error: null });
})  

router.post("/signup", userController.signupRedirect);

router.post("/otpvalidate", userController.otppage);

router.post("/resend-otp", userController.resendOtp);

router.post("/login", userController.loginRedirect);

router.get("/index",userController.indexPage);

router.get('/shop',verifyUser,userController.shopPage)

router.get('/productDetails/:id',verifyUser,userController.productDetails) 

router.post('/logout',userController.logOut)

router.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('https://fitplay.navaneethck.online/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/signup',failureFlash:true}),
    (req, res) => {
      const user = req.user;
      if (user && user.isBlocked) {
        console.log('blocked user accessing home')
        req.flash('error', 'User is blocked. Please contact support.');
        console.log(req.flash('error'))
        // return res.redirect('/signup'); 
        return res.redirect('/signup?error=blocked');
      }
      
      const token = jwt.sign({ id: user._id }, process.env.USER_SECRET_KEY, {
        expiresIn: '12d', 
      });
  
      
      res.cookie('token', token, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, 
        secure: process.env.NODE_ENV === 'production', 
      });
        
        res.redirect('/index');
    }
);

router.get('/contact',verifyUser,profileController.contact)

router.post('/contact',verifyUser,profileController.profileUpdate)

router.get('/address',verifyUser,profileController.address)

router.get('/addressSave',verifyUser,profileController.addressSave)

router.post('/addressSave',verifyUser,profileController.savingAddress)

router.get('/editaddress/:addressId',verifyUser ,profileController.editAddress)

router.post('/editAddress/:id',verifyUser,profileController.saveafterEdit)

router.post('/deleteAddress/:id',verifyUser,profileController.deleteAddress)

router.post('/setDefaultAddress/:addressId',verifyUser,profileController.setDefaultAddress)

router.get('/cart',verifyUser,cartController.getCartPage)

router.post('/addToCart',verifyUser,cartController.addToCart)

router.delete('/cart/remove/:id',verifyUser,cartController.deleteProductCart)

router.get('/checkout',verifyUser,cartController.checkoutPage)

router.get('/checkoutAddress',verifyUser,cartController.checkoutAddressPage) 

router.post('/checkoutAddress',verifyUser,cartController.checkoutaddressSave)

router.get('/checkouteditaddress/:addressId',verifyUser,cartController.checkoutaddressEdit)

router.post('/checkouteditaddress/:addressId',verifyUser,cartController.checkouteditSave)

router.post('/checkout/cod',verifyUser,cartController.handleCod)

router.get('/myOrders',verifyUser,cartController.getmyOrders)

router.post('/cancel-order/:orderId',verifyUser,cartController.cancelOrder)

router.post('/forgot-password',userController.getForgotPassword)

router.get('/forgot-password',userController.getForgotPage)

router.get('/reset-password/:token',userController.getResetpage)

router.post('/reset-password/:token',userController.resetPage)

router.patch('/updateQuantity',verifyUser,userController.updateQuantity)

router.get('/wishlist',verifyUser,wishlistController.getWishlist)

router.post('/wishlist/:productId',verifyUser,wishlistController.addtoWishlist)

router.delete('/wishlist/remove/:productId',verifyUser,wishlistController.removefromWishlist)

router.post('/applyCoupon',verifyUser,couponsController.applyCoupon)

router.get('/coupons',verifyUser,couponsController.gettingCoupon)

router.patch('/removeCoupon',verifyUser,couponsController.removeCoupon)

router.get('/wallet',verifyUser,walletController.getWallet)

router.post('/addWallet',verifyUser,walletController.addWallet)

router.post('/returnProduct/:orderId',verifyUser,cartController.returnProduct)


// router.post('/createOrder',verifyUser,razorpayController.createOrder)

router.post('/applyReferral',verifyUser,userController.referralOffer)

router.get('/invoice/:orderId',verifyUser,invoiceController.getInvoice)

router.post('/saveFailedOrder',verifyUser,async(req,res)=>{
  const { razorpayOrderId, address, userId, paymentMethod, totalAmount, failureReason, items, productOffer, grandTotal, discount } = req.body;

    try {
      const paymentData = req.body;
      console.log('gerbil',paymentData)
      const items = [];
      const cart = await Cart.findOne({ userId: req.body.userId }).populate(
        "items.productId"
      );
      console.log(cart,"<<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>");
      for (let i = 0; i < cart.items.length; i++) {
        const item = {
          productId: cart.items[i].productId._id,
          productName: cart.items[i].productId.productName,
          image: cart.items[i].productId.productImage[0],
          quantity: cart.items[i].quantity,
          price: cart.items[i].price,
          totalPrice: cart.items[i].totalPrice,
          size: cart.items[i].size,
        };
        items.push(item);
      }
      console.log(items);
      const user = await User.findById(req.body.userId);
      const addressIndex = user.addresses.findIndex(
        (address) => address._id.toString() == req.body.address
      );
      if (addressIndex == -1) console.log("Address not found");
      const address = user.addresses[addressIndex];

      console.log(req.body);
      let productOffer =  0;
      let categoryOffer=0
      const grandTotal = req.body.grandTotal || req.body.totalAmount; 
      const discount = req.body.discount || 0;



      //for catgoryOffer and product offer
      for(let item of cart.items){
        const { productId, quantity } = item;
        const { regularPrice, salePrice } = productId;

        productOffer+=(regularPrice-salePrice)*quantity
        categoryOffer+=(regularPrice-salePrice)*quantity
      }
      //for catgroy Offer and productOffer




      const newOrder = new Order({
        user: req.body.userId,
        oid: paymentData.razorpayOrderId || "N/A",
        paymentId: paymentData.razorpayPaymentId,
        items,
        address,
        paymentMethod: "razorpay",
        paymentStatus: "Failed",
        totalAmount: req.body.totalAmount,
        orderDate: new Date(),

        productOffer,
        grandTotal,
        discount,
        categoryOffer
      });

      const savedOrder = await newOrder.save();


        // Save the failed order to the database

        res.json({ success: true, message: 'Failed order details saved successfully.' });
    } catch (error) {
        console.error('Error saving failed order:', error);
        res.status(500).json({ success: false, message: 'Failed to save failed order details.' });
    }
})



//for excel saving order

router.post('/forOrders',async(req,res)=>{
  try {
    const orders=await Order.find()
    .populate('user', 'username email')
    .populate('items.productId', 'productName')
    .exec()

    res.json(orders)
  } catch (error) {
    console.error(error)
  }
})



module.exports = router;

