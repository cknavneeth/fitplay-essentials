const User = require("../../models/userModel.js");
const env = require("dotenv").config();
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const Product = require("../../models/productModel.js");
const Category=require('../../models/categoryModel.js')
const jwt = require("jsonwebtoken");
const statusCodes=require('../../config/keys.js')


function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email, otp) {
  try {
    console.log(email);
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });
    const info = await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: "verify your otp",
      text: `your otp is ${otp}`,
      html: `<b>ypou otp ${otp}</b>`,
    });

    return info.accepted.length > 0;
  } catch (error) {
    console.error("Error sending Email", error);
    return false;
  }
}

exports.signupRedirect = async (req, res) => {
  try {
    console.log(req.body);
    let { username, email, password, password2 } = req.body;
    console.log("check",username,email,password)
    
    username=username.trim()

    const findUser = await User.findOne({ email: email });
    if (findUser) {
      return res.render("user/signup", { error: "EMAIL ALREADY EXISTS" });
      
    }

    const otp = generateOtp();
    const emailSent = await sendVerificationEmail(email, otp);
    console.log(emailSent);

    if (!emailSent) {
      return res.json("emailerror");
    }
    req.session.userOtp = otp;
    req.session.userData = { username, email, password };
    console.log(req.session.userData);
    res.render("user/otpVerification.ejs");
    console.log("OTP send", req.session.userOtp);
  } catch (error) {
    console.error("signup error", error);
  }
};

//password hashing
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {}
};


exports.otppage = async (req, res) => {
  try {
    const { otp } = req.body;
    const sessionOtp = req.session.userOtp;

    if (!otp || !sessionOtp || otp !== sessionOtp) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP, please try again" });
    }

    const user = req.session.userData;

    const passwordHash = await securePassword(user.password);
    console.log(passwordHash);

    const saveUserData = new User({
      username: user.username,
      email: user.email,
      password: passwordHash,
    });

    await saveUserData.save();

    req.session.user = saveUserData.id;

    req.session.userOtp = null;

    return res.status(200).json({
      success: true,
      redirectUrl: "/login",
    });
  } catch (error) {
    console.error("Error", error);
    return res.status(500).json({
      success: false,
      error: "Error occurred during OTP verification",
    });
  }
};



exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.session.userData;
    if (!email) {
      res
        .status(400)
        .json({ success: false, error: "Email is not found.Sorry" });
    }
    const otp = generateOtp();
    req.session.userOtp = otp;
    const emailSent = await sendVerificationEmail(email, otp);
    if (emailSent) {
      res.status(200).json({ success: true, error: "OTP resend successfull" });
      console.log("resend Otp:", otp);
    } else {
      res.status(500).json({ success: false, error: "email not found" });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: "error while sending otp" });
    console.error(error);
  }
};



exports.loginRedirect = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username: username });
   
    const trimmedPassword = password.trim();

    if(user && user.isBlocked===true){
      return res.json({success:false,error:'user is blocked'})
    }

    if (user) {
      
      console.log("Entered Password:", password);
      console.log("Hashed Password:", user.password);

      const isMatch = await user.matchPassword(trimmedPassword);
      console.log("Password Match Result:", isMatch);

      if (isMatch) {
        console.log("Password match successful!");
       

        const token = jwt.sign({ id: user._id },process.env.USER_SECRET_KEY, {
          expiresIn: "12d",
        });

        res.cookie("token", token, {
          httpOnly: true,
          maxAge: 30 * 24 * 60 * 60 * 1000,
          secure: false,
          sameSite: "Lax",
        });
       
        req.session.user=user 
        res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate');
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');
                    
        return res.json({ success: true, error: "Login successful" });
      } else {
        console.log("Invalid login credentials.");
        
        return res.json({ success: false, error: "Invalid login credentials" });
      }
    } else {
      console.log("User not found.");
      
      return res.json({ success: false, error: "Invalid login credentials" });
    }
  } catch (error) {
    console.error(error); 
    return res.status(statusCodes.INTERNAL_SERVER_ERROR).render("user/signup", {
      error: "Something went wrong. Please try again.",
    });
  }
};


exports.indexPage = async (req, res) => {
  try {
    const products = await Product.find({ isBlocked: false });
    // const user = req.session.user || null;
    const userId=req.user.id
    const user=await User.findById(userId)
   
    
    const breadcrumbs = [
      { name: 'Home', url: '/' }
    ];
    res.render("user/index.ejs", { products,user ,breadcrumbs});
  } catch (error) {
    console.error(error);
  }
};
exports.shopPage = async (req, res) => {
  try {
    
    // const user = req.session.user || null;
    const userId=req.user.id
    const user=await User.findById(userId)

    
    const categories=await Category.find({})

    let filter={isBlocked:false}

    if(req.query.category){
      filter.category=req.query.category
    }

    if(req.query.minPrice&&req.query.maxPrice){
      filter.salePrice={
        $gte: Number(req.query.minPrice), 
        $lte: Number(req.query.maxPrice) 
      }
    }


    if(req.query.rating){
      filter.rating={
        $gte:Number(req.query.rating)
      }
    }

    let products=await Product.find(filter)

    const sortOptions=req.query.sort|| 'popularity';
   switch(sortOptions){
    case 'priceLowToHigh':
    products.sort((a,b)=>a.salePrice-b.salePrice)
    break;

    case 'priceHighToLow':
    products.sort((a,b)=>b.salePrice-a.salePrice)
    break;

    case 'averageRating':
    products.sort((a,b)=>b.rating-a.rating)  
    break;

    case 'newArrivals':
    products.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))
    break;

    case 'nameAsc':
      products.sort((a,b)=>a.productName.localeCompare(b.productName))
      break;
   
   case 'nameDesc':
    products.sort((a,b)=>b.productName.localeCompare(a.productName))
    break;
   
   default:
    products = products.sort((a, b) => b.popularity - a.popularity);

   }

    
 
    res.render("user/shop", { products ,user,categories});
  } catch (error) {
    console.error(error);
  }
};

//product detail page
exports.productDetails = async (req, res) => {
  console.log("rendered")
  try {
    const products = await Product.findById(req.params.id);
    const prod = await Product.find({ isBlocked: false });
    
    const user = req.session.user || null;
    let breadcrumbs;
    if (req.headers.referer && req.headers.referer.includes('/shop')) {
      // If coming from the shop page
      breadcrumbs = [
        { name: 'Home', url: '/' },
        { name: 'Shop', url: '/shop' },
        // { name: products.name, url: `/product/${products._id}` }
        { name:'product Details' }
      ];
    } else {
      
      breadcrumbs = [
        { name: 'Home', url: '/' },
        { name:'product Details' }
      ];
    }

    if (!products) {
      res.status(400).json({ error: "product not found" });
    }
    res.render("user/productDetails", { products, prod,user,breadcrumbs  });
    console.log("renderdd")
  } catch (error) {
    console.error(error);
  }
};


exports.logOut=async (req,res)=>{
 req.session.destroy()
  res.cookie('token','',{httpOnly:true,maxAge:1})
  res.redirect('/login')
}

