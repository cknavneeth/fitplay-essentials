const jwt = require("jsonwebtoken");

const User = require("../models/userModel");

// exports.verifyUser = async (req, res, next) => {
//   const token = req.cookies.token;
  
//   if (token) {
//     try {
//       const decode = jwt.verify(token, process.env.USER_SECRET_KEY);
//       console.log(decode);
//       req.user = decode;  
//     } catch (error) {
//       console.error("Token verification failed:", error);
//       req.user = null;    
//     }
//   } else {
//     req.user = null;     
//   }

//   next(); 
// };

// exports.protected = (req, res, next) => {
//   if (!req.user) {
    
//     return res.redirect('/login');
//   }
//   next();
// };

// exports.protected = (req, res, next) => {
//   const token = req.cookies.token;

//   if (token) {
//     try {
//       const decode = jwt.verify(token, process.env.USER_SECRET_KEY);
//       console.log("User verified:", decode);
//       req.user = decode; // Attach user to the request object
//       return next(); // Proceed to the next middleware or route handler
//     } catch (error) {
//       console.error("Token verification failed:", error);
//     }
//   }

//   // Redirect to login if not authenticated
//   return res.redirect('/login');
// };




exports.verifyUser=async(req,res,next)=>{
  const token=req.cookies.token
  if (token) {
    try {
      const decode = jwt.verify(token, process.env.USER_SECRET_KEY);
      console.log("User verified:", decode);
      req.user = decode; 
      return next(); 
    } catch (error) {
      console.error("Token verification failed:", error);
      req.user=null
    }
  }
 req.user=null
 return res.redirect('/login')
  
}








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
      res.clearCookie("token");
      return next();
    }
  } else {
    return next();
  }
};