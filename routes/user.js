const express = require("express");
const router = express.Router();
const userController = require("../controller/user/userController");
const {verifyUser}=require('../middleware/authMiddlware')
const {userLoggedIn}=require('../middleware/authMiddlware')
const passport=require('passport')

console.log("hello")
router.get("/", (req, res) => {
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

router.get('/productDetails/:id',userController.productDetails) 

router.post('/logout',userController.logOut)
// router.get('/auth/google', (req, res, next) => {
//   passport.authenticate('google', { scope: ['profile', 'email'] });
// });
router.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));
// Callback route that Google redirects to after authentication
router.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/signup' }),
    (req, res) => {
        // Successful authentication, redirect to index.
        res.redirect('/index');
    }
);

module.exports = router;

