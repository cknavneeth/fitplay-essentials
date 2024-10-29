const jwt = require("jsonwebtoken");

const User = require("../models/userModel");

exports.verifyUser = async (req, res, next) => {
  const token = req.cookies.token;
  
  if (token) {
    try {
      const decode = jwt.verify(token, process.env.USER_SECRET_KEY);
      console.log(decode);
      req.user = decode;  
    } catch (error) {
      console.error("Token verification failed:", error);
      req.user = null;    
    }
  } else {
    req.user = null;     
  }

  next(); 
};








exports.userLoggedIn = (req, res, next) => {
  const token = req.cookies.token;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.USER_SECRET_KEY);
      if (decoded) {
        console.log(decoded, "its decoded");
        return res.redirect('/index');
      }
    } catch (error) {
      return next();
    }
  } else {
    return next();
  }
};