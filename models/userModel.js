const mongoose=require("mongoose")
const bcrypt=require("bcryptjs")

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
    }
    
})


// userSchema.pre('save',async function (next){

//     console.log(`User ${this.username} is saved now`)

//         if(!this.isModified('password'))return next()
    
//         try{
//             const salt=await bcrypt.genSalt(10)
//             this.password=await bcrypt.hash(this.password,salt)
//             next()

//         }catch(err){
//             console.log(err)
//         }
// })

userSchema.methods.matchPassword=async function(enteredpassword){
  console.log(enteredpassword,this.password)
    ismatch=await bcrypt.compare(enteredpassword,this.password)
    return ismatch
}

module.exports=mongoose.model('users',userSchema)