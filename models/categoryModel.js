const mongoose = require('mongoose');


const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true, 
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isDeleted: {
    type: Boolean,
    default: false, 
},
  categoryOffer:{
   type:Number,
   default:0
}
});


categorySchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Category', categorySchema);
