

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Admin = require('../../models/adminModel'); 

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  console.log('Hashed Password:', hashedPassword);
  return hashedPassword;
};


hashPassword('admin');



