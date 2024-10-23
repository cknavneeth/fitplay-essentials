const mongoose=require("mongoose")
const bcrypt=require("bcryptjs")

const addressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  pincode: { type: String, required: true },
  locality: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  landmark: { type: String },
  alternate_phone: { type: String },
  address_type: { type: String, enum: ['home', 'work'], required: true }
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
    addresses: [addressSchema]
    
})




userSchema.methods.matchPassword=async function(enteredpassword){
  console.log(enteredpassword,this.password)
    ismatch=await bcrypt.compare(enteredpassword,this.password)
    return ismatch
}

module.exports=mongoose.model('users',userSchema)