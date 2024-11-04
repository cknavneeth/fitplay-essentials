const express = require("express");
const router = express.Router();
const userController = require("../controller/user/userController");
const profileController = require("../controller/user/profileController");
const cartController=require('../controller/user/cartController')
const {verifyUser}=require('../middleware/authMiddlware')
const {userLoggedIn}=require('../middleware/authMiddlware')
const passport=require('passport')
const jwt = require('jsonwebtoken');


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

router.get("/index",verifyUser,userController.indexPage);

router.get('/shop',verifyUser,userController.shopPage)

router.get('/productDetails/:id',verifyUser,userController.productDetails) 

router.post('/logout',userController.logOut)

router.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/auth/google/callback', 
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



module.exports = router;

