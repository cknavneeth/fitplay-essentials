const jwt = require("jsonwebtoken");

const User = require("../models/userModel");

exports.verifyUser = async (req, res, next) => {
  let token = req.cookies.token;
  if (token) {
    try {
      const decode = jwt.verify(token,process.env.USER_SECRET_KEY);
      console.log(decode);
      
      // const lalu = await User.findById(decode.id).select("-password");
      // console.log(lalu);
      next();
    } catch (error) {
      console.error(error);
      res.status(400).redirect("/login");
    }
  } else {
    res.status(400);
  }
};

// exports.userLoggedIn = (req,res,next)=> {
//   const token = req.cookies.token||  req.headers.authorization?.split(' ')[1];
 
//   if(!token){
//     // return next()  
//     return res.redirect('/login');
//   }
//   try {
//     const decoded = jwt.verify(token,process.env.USER_SECRET_KEY)
//     if(decoded){
//       console.log(decoded,"its decoded")
//       res.redirect('/index')
//     }
//   } catch (error) {
//     return next()
//   }
// }



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