const mongoose=require("mongoose")
const bcrypt=require("bcryptjs")



const addressSchema = new mongoose.Schema({
  name: { type: String, required: false },
  mobile: { type: String, required: false },
  pincode: { type: String, required: false },
  locality: { type: String, required:  false },
  address: { type: String, required:  false },
  city: { type: String, required:  false },
  state: { type: String, required:  false },
  landmark: { type: String },
  alternate_phone: { type: String },
  address_type: { type: String, enum: ['home', 'work'], required:  false },
  deleted: { type: Boolean, default: false } 
});

const userSchema=new mongoose.Schema({
    username: {
        type: String,
        required: false,
        unique: false
      },
      email: {
        type: String,
        required: true,
        unique: true
      },
      password: {
        type: String, 
        required: false,
      },
      googleId:{
        type:String,
        unique:false
      },
      password2: {
        type: String,
        required:false
      },
      isBlocked: {
        type: Boolean,
        default: false
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    addresses: [addressSchema],
    defaultAddress: { type: mongoose.Schema.Types.ObjectId, ref: 'Address' },

    couponsUsed: [
      {
        coupon: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'coupon',
        },
        usageCount: {
          type: Number,
          default: 0
        }
      }
    ]
    
})




userSchema.methods.matchPassword=async function(enteredpassword){
  console.log(enteredpassword,this.password)
    ismatch=await bcrypt.compare(enteredpassword,this.password)
    return ismatch
}

// module.exports=mongoose.model('users',userSchema)
// module.exports = {
//   User: mongoose.model('users', userSchema),  // Only the user model
//   addressSchema  // Export addressSchema if needed elsewhere
// };
module.exports = {
  User: mongoose.model('User', userSchema),  
  addressSchema  
};

