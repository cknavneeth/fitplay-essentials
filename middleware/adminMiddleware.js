const jwt = require("jsonwebtoken");

const User = require("../models/adminModel");

exports.verifyAdmin = async (req, res, next) => {
  let adminToken = req.cookies.adminToken;
  console.log(adminToken)
  if(!adminToken){
    res.redirect('/admin')
  }
  if (adminToken) {
    try {
      const decode = jwt.verify(adminToken,process.env.ADMIN_SECRET_KEY);
      const lalu = await User.findById(decode.id).select("-password");
      console.log(lalu);
      next();
    } catch (error) {
      console.error(error);
      res.status(400)
    }
  } else {
    res.status(400);
  }
};


exports.AdminLoggedIn = (req,res,next)=> {
    const adminToken = req.cookies.adminToken ||  req.headers.authorization?.split(' ')[1];
   
    if(!adminToken){
      return next()  
    }
    try {
      const decoded = jwt.verify(adminToken,process.env.ADMIN_SECRET_KEY)
      if(decoded){
        console.log(decoded,"its decoded")
        res.redirect('/dashboard')
      }
    } catch (error) {
      return next()
    }
  }
 

    

