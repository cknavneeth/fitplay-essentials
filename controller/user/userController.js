const { User, addressSchema } = require("../../models/userModel.js");
const env = require("dotenv").config();
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const Product = require("../../models/productModel.js");
const Category = require("../../models/categoryModel.js");
const jwt = require("jsonwebtoken");
const statusCodes = require("../../config/keys.js");
const crypto = require("crypto");
const Cart = require("../../models/cartModel.js");
const Coupon = require("../../models/couponModel.js");
const Wallet=require("../../models/walletModel.js");
const order = require("../../models/orderModel.js");

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




function generateReferralCode() {
  return crypto.randomBytes(4).toString('hex'); // Generates an 8-character code
}
exports.signupRedirect = async (req, res) => {
  try {
    console.log(req.body);
    let { username, email, password, password2 } = req.body;
    console.log("check", username, email, password);

    username = username.trim();

    const findUser = await User.findOne({ email: email });
    if (findUser) {
      return res.render("user/signup", { error: "EMAIL ALREADY EXISTS" });
    }

    //for referral offer
    // let referredBy = null;
    // if (refferalCode) {
    //   const referrer = await User.findOne({ refferalCode });
    //   if (referrer) {
    //     referredBy = referrer._id;
    //   } else {
    //     return res.render("user/signup", { error: "Invalid referral code" });
    //   }
    // }

    const newReferralCode = generateReferralCode();
    console.log('puthiya referal code',newReferralCode)

    //for refferal offer


    const otp = generateOtp();
    const emailSent = await sendVerificationEmail(email, otp);
    console.log(emailSent);

    if (!emailSent) {
      return res.json("emailerror");
    }
    req.session.userOtp = otp;
    req.session.otpExpires = Date.now() + 1000 * 60 * 2;
    req.session.userData = { username, email, password,newReferralCode };
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
    const otpExpires = req.session.otpExpires;

    if (Date.now() > otpExpires) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP, please try again" });
    }

    // const sessionOtp=Date.now>req.session.otpExpires?null:req.session.userOtp

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
      referalCode:user.newReferralCode
    });

    await saveUserData.save();

    req.session.user = saveUserData.id;

    req.session.userOtp = null;

    res.clearCookie("token");

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
    req.session.otpExpires = Date.now() + 1000 * 60 * 2;
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

    if (user && user.isBlocked === true) {
      return res.json({ success: false, error: "user is blocked" });
    }

    if (user) {
      console.log("Entered Password:", password);
      console.log("Hashed Password:", user.password);

      const isMatch = await user.matchPassword(trimmedPassword);
      console.log("Password Match Result:", isMatch);

      if (isMatch) {
        console.log("Password match successful!");

        const token = jwt.sign({ id: user._id }, process.env.USER_SECRET_KEY, {
          expiresIn: "12d",
        });

        res.cookie("token", token, {
          httpOnly: true,
          maxAge: 30 * 24 * 60 * 60 * 1000,
          secure: false,
          sameSite: "Lax",
        });

        req.session.user = user;
        res.header(
          "Cache-Control",
          "no-cache, private, no-store, must-revalidate"
        );
        res.header("Expires", "-1");
        res.header("Pragma", "no-cache");

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

    //for decode
    let user = null;

    
    const token = req.cookies.token;
    if (token) {
      try {
        const decode = jwt.verify(token, process.env.USER_SECRET_KEY);
        console.log("User verified:", decode);
        req.user = decode;

        const userId = req.user ? req.user.id : null;
        if (userId) {
          user = await User.findById(userId);
        }
      } catch (err) {
        console.error("Token verification failed:", err);
        req.user = null; 
      }
    }

    const breadcrumbs = [{ name: "Home", url: "/" }];
    res.render("user/index.ejs", { products, user, breadcrumbs });
  } catch (error) {
    console.error(error);
  }
};

exports.shopPage = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const categories = await Category.find({});

    let filter = { isBlocked: false };

    if (req.query.search) {
      const searchTerm = req.query.search.trim(); 
      filter.productName = { $regex: new RegExp("^" + searchTerm, "i") }; 
    }
    
    

    if (req.query.category) {
      filter.category = req.query.category;
    }

   
    if (req.query.minPrice && req.query.maxPrice) {
      filter.salePrice = {
        $gte: Number(req.query.minPrice),
        $lte: Number(req.query.maxPrice),
      };
    }

   
    if (req.query.rating) {
      filter.rating = {
        $gte: Number(req.query.rating),
      };
    }

    
    


    const page=parseInt(req.query.page)||1
    const limit=parseInt(req.query.limit)||10
    const skip=(page-1)*limit

    const totalDocuments=await Product.countDocuments(filter)

    const totalPages=Math.ceil(totalDocuments/limit)
    

    
    let products = await Product.find(filter)
    .skip(skip)
    .limit(limit)
    .sort({createdAt:-1})

    //for popularity iam doing this
    const recentOrders=await order.find({orderDate:{$gte:new Date(Date.now()-30*24*60*60*1000)}})

    console.log("Recent Orders:", recentOrders);


    const productPopularity={}
    recentOrders.forEach(order=>{
      order.items.forEach(item=>{
        const productId=item.productId.toString()
        if(!productPopularity[productId]){
          productPopularity[productId]=0
        }
        productPopularity[productId]+=item.quantity
      })
    })

    console.log("Product Popularity:", productPopularity);
    console.log("Product IDs in Products Array:", products.map(p => p._id.toString()));



    
    const sortOptions = req.query.sort || "popularity";
    switch (sortOptions) {
      case "priceLowToHigh":
        products.sort((a, b) => a.salePrice - b.salePrice);
        break;

      case "priceHighToLow":
        products.sort((a, b) => b.salePrice - a.salePrice);
        break;

      case "averageRating":
        products.sort((a, b) => b.rating - a.rating);
        break;

      case "newArrivals":
        products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;

      case "nameAsc":
        products.sort((a, b) => a.productName.localeCompare(b.productName));
        break;

      case "nameDesc":
        products.sort((a, b) => b.productName.localeCompare(a.productName));
        break;

      case "popularity":
          products.sort((a, b) => {
            const popularityA = productPopularity[a._id.toString()] || 0; 
            const popularityB = productPopularity[b._id.toString()] || 0;
            return popularityB - popularityA;
          });
      break;

      
        default:
          products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break; 
        
    }

    res.render("user/shop", { products, user, categories ,currentPage:page,totalPages,limit, 
      query: req.query });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while loading the shop page.");
  }
};







//product detail page
exports.productDetails = async (req, res) => {
  console.log("rendered");
  try {
    const products = await Product.findById(req.params.id);
    console.log(products.sizes);
    const sizeStock = products.sizes;

    const prod = await Product.find({ isBlocked: false });

    // const user = req.session.user || null;
    const userId = req.user.id;
    const user = await User.findById(userId);
    let breadcrumbs;
    if (req.headers.referer && req.headers.referer.includes("/shop")) {
      breadcrumbs = [
        { name: "Home", url: "/" },
        { name: "Shop", url: "/shop" },

        { name: "product Details" },
      ];
    } else {
      breadcrumbs = [{ name: "Home", url: "/" }, { name: "product Details" }];
    }

    if (!products) {
      res.status(400).json({ error: "product not found" });
    }
    res.render("user/productDetails", {
      products,
      prod,
      user,
      breadcrumbs,
      sizeStock,
    });
    console.log("renderdd");
  } catch (error) {
    console.error(error);
  }
};

exports.logOut = async (req, res) => {
  req.session.destroy();
  res.cookie("token", "", { httpOnly: true, maxAge: 1 });
  res.redirect("/login");
};

exports.getForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json({ success: false, error: "user not found" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

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

    const mailOptions = {
      to: user.email,
      subject: "Password Reset",
      text: `Please click the following link to reset your password: http://localhost:3000/reset-password/${token}`,
    };
    console.log(
      `Password reset link (for testing): http://localhost:3000/reset-password/${token}`
    );

    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.error("Error sending email:", err);
        return res.status(statusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: "Error occurred while sending email",
        });
      }
      console.log("Email sent:", info.response);
      return res
        .status(statusCodes.OK)
        .json({ success: true, error: "Reset link sent successfully" });
    });
  } catch (error) {
    console.error(error);
  }
};

exports.getForgotPage = async (req, res) => {
  try {
    res.render("user/forgotPassword");
  } catch (error) {
    console.error(error);
  }
};

exports.getResetpage = async (req, res) => {
  try {
    const token = req.params.token;
    console.log("Token received:", token);

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    console.log("User found:", user);
    if (!user) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json({ success: false, error: "user not found" });
    }

    res.render("user/resetPassword", { token });
  } catch (error) {
    console.error(error);
  }
};

exports.resetPage = async (req, res) => {
  try {
    const token = req.params.token;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json({ success: false, error: "password illa" });
    }

    if (password !== confirmPassword) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json({ success: false, error: "password do not match" });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    console.log("Reset token saved:", token);
    console.log("Token expiration:", user.resetPasswordExpires);

    if (!user) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json({ success: false, error: "password token expired i think" });
    }
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();
    // res.send('password has been reset successfully')
    return res
      .status(statusCodes.OK)
      .json({ success: true, error: "password has been reset successfully" });
  } catch (error) {
    console.error(error);
  }
};


exports.updateQuantity = async (req, res) => {
  let { newQuantity, productId } = req.body;
  const userId = req.user.id;

  try {
      const cart = await Cart.findOne({ userId });
      if (!cart) return res.status(400).json({ message: "Cart not found" });

      const existingItemIndex = cart.items.findIndex(
          item => item._id.toString() === productId
      );
      if (existingItemIndex === -1) {
          return res.status(400).json({ message: "Product not found in cart" });
      }

      //for no quantity
      if(!newQuantity){
        return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'please provide quantity'})
      }
      //for no quantity

      //for negative quantity
      if(newQuantity<0){
        newQuantity=1

        cart.items[existingItemIndex].quantity=newQuantity
        cart.items[existingItemIndex].totalPrice=newQuantity*cart.items[existingItemIndex].price

        const subtotal=cart.items.reduce((sum,item)=> sum+item.totalPrice,0)
        cart.subTotal=subtotal

        let discountAmount = 0
        
        if(cart.couponCode){
          const coupon=await Coupon.findOne({couponCode:couponCode})
          if(coupon){
            if(discountType==='percentage'){
              discountAmount=cart.subTotal*(coupon.discountAmount/100)
            }else if(discountType==='fixed'){
              discountAmount=coupon.discountAmount
            }
            if(coupon.maxDiscount&&discountAmount>coupon.maxDiscount){
              discountAmount=coupon.maxDiscount
            }
            cart.discount=discountAmount
          }else{
          cart.couponCode=null
          cart.discountAmount=0
        }
      }

        cart.grandTotal=cart.grandTotal-discountAmount

        await cart.save()

        return res.status(400).json({
          success: false,
          message: "Quantity cannot be negative. Reset to 1.",
          cartTotal: cart.subTotal,
          grandTotal: cart.grandTotal,
          couponCode: cart.couponCode,
          discountAmount: cart.discount,
          items: cart.items,
        });
        
      }
      //for negative quantity

      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].totalPrice =
          newQuantity * cart.items[existingItemIndex].price;

      const subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
      cart.subTotal = subtotal;

      let discountAmount = 0;
      if (cart.couponCode) {
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
      res.json({
          message: "Quantity updated successfully",
          cartTotal: cart.subTotal,
          grandTotal: cart.grandTotal,
          couponCode: cart.couponCode,
          discountAmount: cart.discount,
          items: cart.items
      });
  } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
  }
};
               
 // Define these if not already defined

 exports.referralOffer = async (req, res) => {
  try {
      const { referralCode } = req.body;

     
      const user = await User.findOne({ referalCode: referralCode });
      if (!user) {
          return res.status(400).json({ success: false, error: 'Invalid referral code' });
      }

     
      const userId = req.user.id;
      const currentUser = await User.findById(userId);

      
      if (currentUser.appliedReferalCode) {
          return res.status(400).json({ success: false, error: 'Referral code already applied' });
      }

      
      currentUser.appliedReferalCode = true;
      await currentUser.save();

      const amount = 500;

     
      let currentUserWallet = await Wallet.findOne({ userId });
      if (!currentUserWallet) {
          currentUserWallet = new Wallet({
              userId,
              balance: 0,
              transaction: []
          });
      }

     
      currentUserWallet.balance += amount;
      currentUserWallet.transaction.push({
          transactionType: 'credit',
          amount,
          status: 'completed',
          
      });
      await currentUserWallet.save();

      let userWallet = await Wallet.findOne({ userId: user._id });
      if (!userWallet) {
          userWallet = new Wallet({
              userId: user._id,
              balance: 0,
              transaction: []
          });
      }

      
      userWallet.balance += amount;
      userWallet.transaction.push({
          transactionType: 'credit',
          amount,
          status: 'completed',
      });
      await userWallet.save();

      
      return res.status(200).json({ success: true, message: 'Referral amount added to wallet' });
  } catch (error) {
      console.error('Unexpected error:', error);
      return res.status(500).json({ success: false, error: 'An unexpected error occurred' });
  }
};




