const mongoose=require("mongoose")
const bcrypt=require("bcryptjs")

const userSchema=new mongoose.Schema({
    // name:{
    //     type:"String",
    //     required:true
    // },
    email:{
        type:"String",
        required:true,
        unique:true
    },
    password:{
        type:"String",
        required:true
    },
    isAdmin:{
        type:Boolean,
        default:true
    }
    // role: {
    //     type: String,
    //     enum: ['user', 'admin'],
    //     default: 'user'
    // }
   
})

// userSchema.pre('save',async function(next){
//     if(!this.isModified("password"))return next();
//     // this.password= await bcrypt.hash(this.password,10)
//      try{
//         const salt=await bcrypt.genSalt(10)
//         this.password=await bcrypt.hash(this.password,salt)
//         console.log(this.password)
//         next();
//     }catch(err){
//         next(err)
//     }

// })

    

    userSchema.methods.matchPassword=async function(enteredPassword){
        console.log('Entered Password:', enteredPassword); 
        console.log('Hashed Password:', this.password); 
        return  await bcrypt.compare(enteredPassword,this.password)
         
        // return isMatch
    }


module.exports=mongoose.model('Admin',userSchema)