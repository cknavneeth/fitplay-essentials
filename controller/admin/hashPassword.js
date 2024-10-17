// hashPassword.js

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Admin = require('../../models/adminModel'); 

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  console.log('Hashed Password:', hashedPassword);
  return hashedPassword;
};

// Replace 'yourpassword' with the password you want to hash
hashPassword('admin');



// const storeHashedPassword = async () => {
//     const hashedPassword = await hashPassword('admin'); // Hash the password
//     const newAdmin = new Admin({
//       email: 'admin@gmail.com',
//       password: hashedPassword,
//       role: 'admin' // Optional
//     });
//     await newAdmin.save(); // Save to MongoDB
//     console.log('Admin saved with hashed password:', newAdmin);
//   };
  
//   storeHashedPassword();