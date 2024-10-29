const Cart=require('../../models/cartModel')
const User=require('../../models/userModel')

exports.getCartPage=async(req,res)=>{
    try {
        const id=req.user.id
        const user=await User.findById(id)
        res.render('user/cart',{user})
    } catch (error) {
        console.error(error)
    }
}