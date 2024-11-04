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
    console.log("check", username, email, password);

    username = username.trim();

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
    req.session.otpExpires = Date.now() + 1000 * 60 * 2;
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

    // const userId=req.user.id
    // const user=await User.findById(userId)
    const userId = req.user ? req.user.id : null;

    let user = null;
    if (userId) {
      user = await User.findById(userId);
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

    let products = await Product.find(filter);

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

      default:
        products = products.sort((a, b) => b.popularity - a.popularity);
    }

    res.render("user/shop", { products, user, categories });
  } catch (error) {
    console.error(error);
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
  try {
    const { newQuantity, productId } = req.body;
    const userId = req.user.id;
    console.log(newQuantity, productId, userId);

    const cart = await Cart.findOne({ userId });
    console.log(cart, "<<cart>>>");
    if (!cart) return res.status(400).json({ message: "cart not found " });

    // const existingItem = cart.items.findIndex(
    //   (item) => item._id.toString() == productId
    // );
    const existingItem = cart.items.findIndex(
      (item) => item._id.toString() == productId
    );
    if (existingItem == -1)
      return res.status(400).json({ message: "Product not found in cart" });

    cart.items[existingItem].quantity = newQuantity;
    cart.items[existingItem].totalPrice =
      newQuantity * cart.items[existingItem].price;

    console.log(
      "<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< ",
      cart.items[existingItem],
      ">>>>>>>>>>>>>>>>>>"
    );
    await cart.save();
    return res.status(200).json({ message: "Quantity updated successfully" });
  } catch (error) {
    console.log(error);
  }
};
