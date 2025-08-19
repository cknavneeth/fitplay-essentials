// controllers/paymentController.js
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../../models/orderModel")
const { User } = require("../../models/userModel");
const Cart = require("../../models/cartModel");
const Product = require("../../models/productModel");
const Redis=require('ioredis');
const StatusCodes = require("../../config/keys");

const redis=new Redis(process.env.REDIS_URL)

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

module.exports.createOrder = async (req, res) => {

  const userId=req.user.id

   const lock=await redis.get(`payment_modal_lock:${userId}`) 
   if(lock){
     return res.status(StatusCodes.FORBIDDEN).json({ error: "You have already opened the payment window. Please wait 10 minutes." });
   }

    await redis.set(`payment_modal_lock:${userId}`,'true','EX',600)

  const options = {
    amount: req.body.amount * 100,
    currency: req.body.currency,
    receipt: "unique_receipt_" + Date.now(),
    payment_capture: 1,
  };
  try {
    const response = await razorpay.orders.create(options);
    res.json({
      order_id: response.id,
      currency: response.currency,
      amount: response.amount,
      key_id: process.env.RAZORPAY_ID,
    }); 
  } catch (err) {
    await redis.del(`payment_modal_lock:${userId}`)
    res.status(400).send("Not able to create order. Please try again!");
  }
};

module.exports.paymentCapture = async (req, res) => {
  try {

    const userId=req.user.id


    const razorpaySignature = req.body.razorpaySignature;

    if (!razorpaySignature) {
      return res.status(400).json({ error: "No signature provided" });
    }

    const cart = await Cart.findOne({ userId: req.user.id }).populate("items.productId");
    if(!cart){
      console.log('bro cart illa')
    }
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Your cart is empty! Add this product to the cart from the shop.",
      });
    }

    
    const outofstock = [];
    const handleOutofstock = cart.items.map(async (item) => {
      const product = await Product.findById(item.productId);
      if (product) {
        const sizeStock = product.sizes.find((s) => s.size === item.size);
        if (!sizeStock || sizeStock.stock < item.quantity) {
          outofstock.push({
            productId: item.productId,
            productName: item.productId.productName,
            productImage: item.productId.productImage,
            size: item.size
          });
        }
      }
    });
    await Promise.all(handleOutofstock);

    if (outofstock.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Some products are out of stock. Please try again later.",
        outofstock,
      });
    }

    // ---- SIGNATURE VERIFICATION ----
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(req.body.razorpayOrderId + "|" + req.body.razorpayPaymentId)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ status: "error", error: "Invalid signature" });
    }

    // ---- CREATE ORDER ----
    const items = cart.items.map(item => ({
      productId: item.productId._id,
      productName: item.productId.productName,
      image: item.productId.productImage[0],
      quantity: item.quantity,
      price: item.price,
      totalPrice: item.totalPrice,
      size: item.size
    }));

    const user = await User.findById(req.body.userId);
    const address = user.addresses.find(addr => addr._id.toString() == req.body.address);

    const grandTotal = req.body.grandTotal || req.body.totalAmount;
    const discount = req.body.discount || 0;

    let productOffer = 0;
    let categoryOffer = 0;
    for (let item of cart.items) {
      const { regularPrice, salePrice } = item.productId;
      productOffer += (regularPrice - salePrice) * item.quantity;
      categoryOffer += (regularPrice - salePrice) * item.quantity;
    }

    const newOrder = new Order({
      user: req.body.userId,
      oid: req.body.razorpayOrderId,
      paymentId: req.body.razorpayPaymentId,
      items,
      address,
      paymentMethod: "razorpay",
      paymentStatus: "Completed",
      totalAmount: req.body.totalAmount,
      orderDate: new Date(),
      productOffer,
      grandTotal,
      discount,
      categoryOffer
    });

    await newOrder.save();

    // ---- UPDATE STOCK ----
    await Promise.all(newOrder.items.map(async (item) => {
      const product = await Product.findById(item.productId);
      if (product) {
        const sizeStock = product.sizes.find(s => s.size === item.size);
        if (sizeStock) sizeStock.stock -= item.quantity;
        await product.save();
      }
    }));

    await Cart.findByIdAndDelete(cart._id);


    await redis.del(`payment_modal_lock:${userId}`)

    res.json({
      success:true,
      status: "ok",
      message: "Payment verified successfully",
      orderId: req.body.razorpayOrderId,
      items: newOrder.items,
      grandTotal: newOrder.grandTotal
    });

  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ status: "error", error: "Internal server error" });
  }
};
