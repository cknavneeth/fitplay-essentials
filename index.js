const mongoose=require("mongoose")
const session=require("express-session")
const path=require("path")
const dotenv=require("dotenv")
const ejs=require("ejs")
const express=require("express")
const crypto=require("crypto")
// const userRoute=require("./routes/user")
const userRoute=require("./routes/user")
const adminRoute=require("./routes/admin")
const passport=require('./config/passport')
const cookieParser = require("cookie-parser")
// const { urlencoded } = require("body-parser")
const flash = require('connect-flash')


dotenv.config({path:".env"})
 

const app=express()
const PORT= process.env.PORT||3000
// console.log(PORT)

mongoose.connect(process.env.MONGO_URI,{
    //    useNewUrlParser:true,
    //    useUnifiedTopology:true
}).then(()=>console.log("mongoDB is connected"))
.catch((err)=>console.log(err))


//nocache 
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});


//middlewares
app.use(express.urlencoded({extended:true}))
app.use(express.static('public'))
app.use(express.json())
app.set("view engine","ejs")
app.set('views', path.join(__dirname, 'views'));
app.use(cookieParser())

//session
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{maxAge:1800000}
}))

app.use(flash());

// Middleware to make flash messages accessible in templates
// app.use((req, res, next) => {
//     res.locals.error = req.flash('error');
//     res.locals.success = req.flash('success');
//     next();
// });
app.use((req, res, next) => {
    res.locals.error = req.flash('error');
    res.locals.success_msg = req.flash('success_msg');
    next();
});

app.use(passport.initialize())
app.use(passport.session())

//routes
app.use("/",userRoute)
app.use("/",adminRoute)



app.listen(PORT,function(){
      console.log("it is running")
})



