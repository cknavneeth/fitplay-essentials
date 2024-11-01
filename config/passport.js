const passport=require("passport")
const GoogleStrategy=require("passport-google-oauth20").Strategy
// const User = require('../../models/userModel.js');
const path = require('path');
const {User} = require(path.resolve(__dirname, '../models/userModel.js'));
// const { User } = require("../../models/userModel.js"); 
require('dotenv').config()



// })
// module.exports=passport
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET);

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
},


async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('passport useeee')
        let user = await User.findOne({ googleId: profile.id });
        if (user) {

            if (user.status === "blocked") {
                return done(null, false, { message: 'User is blocked. Please contact support.' });
            }
            
            
            return done(null, user);
        } else {
            user = new User({
                name: profile.displayName,
                email: profile.emails[0].value,  
                googleId: profile.id,
                status:'active'
            });
            await user.save();
            return done(null, user);
        }
    } catch (err) {
        return done(err, null);
    }
}));

passport.serializeUser((user,done)=>{
  
    
   done(null,user.id)
})

passport.deserializeUser((id,done)=>{
    User.findById(id)
    .then(user=>{
        done(null,user)
    })
    .catch(err=>{
        done(err,null)
    })

})
module.exports=passport






