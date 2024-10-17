// const multer=require("multer")
// const path=require("path")
  

// const storage=multer.diskStorage({
//     destination:(req,file,cb)=>{
//         cb(null,path.join(__dirname,"../public/uploads/re-image"))
//     },
//     filename:(req,file,cb)=>{
//         cb(null,Date.now()+"-"+file.originalname)
//     }
// })
// const uploads = multer({ storage });

// module.exports=storage
const multer = require('multer');
const path = require("path");



// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/uploads/re-image")); // Folder for storing files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Unique filename
  }
});

// Initialize multer with the storage configuration
const uploads = multer({ storage });
console.log(uploads)

// Export the configured multer instance
module.exports = uploads;
