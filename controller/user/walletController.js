const Wishlist = require("../../models/wishlistModel.js");
const Product = require("../../models/productModel.js");
const Category = require("../../models/categoryModel.js");
const Wallet=require('../../models/walletModel.js')
const jwt = require("jsonwebtoken");
const statusCodes = require("../../config/keys.js");
const crypto = require("crypto");
const { User } = require("../../models/userModel.js"); 
const mongoose = require("mongoose");






exports.getWallet = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        let wallet = {  
            balance: 0,
            transaction: []
        };

        const foundWallet = await Wallet.findOne({ userId });
        if (foundWallet) {
            wallet = foundWallet;
        }

        res.render('user/wallet', {
            user,
            wallet, 
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};




exports.addWallet=async(req,res)=>{
    try {
        const userId=req.user.id
        const user=await User.findById(userId)

        const {amount}=req.body

        if(amount<0){
            return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'invalid amount'})
        }

        if(amount>100){
            return res.status(statusCodes.BAD_REQUEST).json({success:false,error:'invalid amount'})
        }

        let wallet=await Wallet.findOne({userId})

        if(!wallet){
             wallet=new Wallet({
                userId,
                balance:0,
                transaction:[]
            })
            await wallet.save()
        }

        wallet.balance+=amount

        wallet.transaction.push({
            transactionType:'credit',
            amount,
            status:'completed'
        })

        await wallet.save()

        res.json({success:true,balance:wallet.balance})


    } catch (error) {
        console.error(error)
    }
}