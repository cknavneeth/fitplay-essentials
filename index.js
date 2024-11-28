const mongoose = require("mongoose");
const session = require("express-session");
const path = require("path");
const dotenv = require("dotenv");
const ejs = require("ejs");
const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");

// const userRoute=require("./routes/user")
const userRoute = require("./routes/user");
const adminRoute = require("./routes/admin");
const passport = require("./config/passport");
const cookieParser = require("cookie-parser");
// const { urlencoded } = require("body-parser")
const flash = require("connect-flash");
const { send } = require("process");

const Order = require("./models/orderModel");
const { User } = require("./models/userModel");
const Cart = require("./models/cartModel");
const Product = require("./models/productModel");
const cart = require("./models/cartModel");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

dotenv.config({ path: ".env" });

const app = express();
const PORT = process.env.PORT || 3000;
// console.log(PORT)

mongoose
  .connect(process.env.MONGO_URI, {
    //    useNewUrlParser:true,
    //    useUnifiedTopology:true
  })
  .then(() => console.log("mongoDB is connected"))
  .catch((err) => console.log(err));

//nocache
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

//middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(cookieParser());

//session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1800000 },
  })
);

app.use(flash());

// Middleware to make flash messages accessible in templates
// app.use((req, res, next) => {
//     res.locals.error = req.flash('error');
//     res.locals.success = req.flash('success');
//     next();
// });
app.use((req, res, next) => {
  res.locals.error = req.flash("error");
  res.locals.success_msg = req.flash("success_msg");
  next();
});

app.use(passport.initialize());
app.use(passport.session());

//routes
app.use("/", userRoute);
app.use("/", adminRoute);

//everything for reazorpay
app.post("/order", async (req, res) => {
  // initializing razorpay
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_ID,
    key_secret: process.env.RAZORPAY_SECRET,
  });

  // setting up options for razorpay order.

  const options = {
    amount: req.body.amount*100,
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
    res.status(400).send("Not able to create order. Please try again!");
  }
});

// const secret_key = process.env.RAZORPAY_SECRET;


app.use((req, res, next) => {
  if (req.path === "/paymentCapture") {
    return next();
  }
  express.json()(req, res, next);
});

app.post(
  "/paymentCapture",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const razorpaySignature = req.body.razorpaySignature;


      if (!razorpaySignature) {
        console.log("No Razorpay signature found in headers");
        return res.status(400).json({ error: "No signature provided" });
      }
      


      console.log("User ID :", req.body.userId);
      const cart = await Cart.findOne({ userId:req.body.userId}).populate("items.productId");

      console.log('allahhhyu',cart)

      const retry = req.body.retry;
      console.log(req.body);
      if(retry){
        const orderId = req.body.orderId;
        const order = await Order.findById(orderId);

        if(!order){
          return res.status(400).json({error:"Order not found"});
        }else{

          //checking quantity in repayment
          const outofstock=[]
          const handleOutofstock=order.items.map(async(item)=>{
            const product=await Product.findById(item.productId)
            if(product){
              const sizeStock=product.sizes.find((s)=>s.size===item.size)
              if(!sizeStock||sizeStock.stock<item.quantity){
                outofstock.push({
                  productId:item.productId,
                  productName:item.productName,
                  productImage:item.productId.productImage,
                  size:item.size
                })

              }
            }
          })
          await Promise.all(handleOutofstock)
          if (outofstock.length > 0) {
            return res.status(400).json({
                success: false,
                error: "Some products are out of stock. Please try again later after stock fills.",
                outofstock,
            });
        }


          //checking quantity in repayment
          

          order.paymentStatus = "Completed";
          await order.save()
          
          const handleQuantity=order.items.map(async(item)=>{
            const product=await Product.findById(item.productId)
            if(product){
              const sizeStock=product.sizes.find(s=>s.size===item.size)
              if(sizeStock){
                sizeStock.stock-=item.quantity
              }
              await product.save()
            }
          })
          await Promise.all(handleQuantity)
          // await Cart.findByIdAndDelete(cart._id);
          
          return res.status(200).json({error:"Payment Success",success:true})
        }
      }

      if (!retry &&(!cart || cart.items.length === 0)) {
        return res.status(400).json({
          success: false,
          error: "Your cart is empty! Add this product to the cart from the shop.",
        });
      }

      //failed orders

      //checking quantity for normal orders
      
      const cart2 = await Cart.findOne({ userId:req.body.userId})
      const outofstock=[]
      const handleOutofstock=cart2.items.map(async(item)=>{
        const product=await Product.findById(item.productId)
        if(product){
          const sizeStock=product.sizes.find((s)=>s.size===item.size)
          if(!sizeStock||sizeStock.stock<item.quantity){
            outofstock.push({
              productId:item.productId,
              productName:item.productName,
              productImage:item.productId.productImage,
              size:item.size
            })

          }
        }
      })
      await Promise.all(handleOutofstock)
      if (outofstock.length > 0) {
        return res.status(400).json({
            success: false,
            error: "Some products are out of stock. Please try again later after stock fills.",
            outofstock,
        });
    }
      //checking quantity for normal orders

      // Get the raw body as a string
      const rawBody = req.body;
      console.log(rawBody, "ASDF<<<>>>");
      // Debug logs
      console.log("Received webhook payload:", rawBody);
      console.log("Received signature:", razorpaySignature);

      // Calculate expected signature
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET)
        .update(rawBody.razorpayOrderId + "|" + rawBody.razorpayPaymentId)
        .digest("hex");

      console.log("Calculated signature:", expectedSignature);

      // Verify signature
      if (expectedSignature === razorpaySignature) {
        // Parse the webhook payload
        const paymentData = req.body;

        const items = [];
        const cart = await Cart.findOne({ userId: req.body.userId }).populate(
          "items.productId"
        );
        console.log(cart,"<<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>");
        for (let i = 0; i < cart.items.length; i++) {
          const item = {
            productId: cart.items[i].productId._id,
            productName: cart.items[i].productId.productName,
            image: cart.items[i].productId.productImage[0],
            quantity: cart.items[i].quantity,
            price: cart.items[i].price,
            totalPrice: cart.items[i].totalPrice,
            size: cart.items[i].size,
          };
          items.push(item);
        }
        console.log(items);
        const user = await User.findById(req.body.userId);
        const addressIndex = user.addresses.findIndex(
          (address) => address._id.toString() == req.body.address
        );
        if (addressIndex == -1) console.log("Address not found");
        const address = user.addresses[addressIndex];

        console.log(req.body);
        let categoryOffer=0
        let productOffer =0;
        const grandTotal = req.body.grandTotal || req.body.totalAmount; 
        const discount = req.body.discount || 0;

        //for category and product offer
        
        for(let item of cart.items){
          const { productId, quantity } = item;
          const { regularPrice, salePrice } = productId;

          productOffer+=(regularPrice-salePrice)*quantity
          categoryOffer+=(regularPrice-salePrice)*quantity
        }
        //for catgeory and productOffer






        const newOrder = new Order({
          user: req.body.userId,
          oid: paymentData.razorpayOrderId,
          paymentId: paymentData.razorpayPaymentId,
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

        const savedOrder = await newOrder.save();

        //for quantity
       

        const handleQuantity=newOrder.items.map(async(item)=>{
          const product=await Product.findById(item.productId)
          if(product){
            const sizeStock=product.sizes.find(s=>s.size===item.size)
            if(sizeStock){
              sizeStock.stock-=item.quantity
            }
            await product.save()
          }
        })
        await Promise.all(handleQuantity)

        //for quantity
        console.log("Order saved successfully:", savedOrder);

        await Cart.findByIdAndDelete(cart._id);

        return res.json({
          status: "ok",
          message: "Payment verified successfully",
          orderId: paymentData.razorpayOrderId, //
          items: savedOrder.items,   // Array of ordered items
          grandTotal: savedOrder.grandTotal || savedOrder.totalAmount,
        });
      } else {
        console.log("Signature verification failed");
        return res.status(400).json({
          status: "error",
          error: "Invalid signature",
        });
       
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      return res.status(500).json({
        status: "error",
        error: "Internal server error",
      });
    }
  }
);









// app.post(
//   "/paymentCapture",
//   express.raw({ type: "application/json" }),
//   async (req, res) => {
//     try {
//       const razorpaySignature = req.body.razorpaySignature;

//       if (!razorpaySignature) {
//         console.log("No Razorpay signature found in headers");
//         return res.status(400).json({ error: "No signature provided" });
//       }

//       // Get the raw body as a string
//       const rawBody = req.body;
//       console.log(rawBody, "ASDF<<<>>>");
//       // Debug logs
//       console.log("Received webhook payload:", rawBody);
//       console.log("Received signature:", razorpaySignature);

//       // Calculate expected signature
//       const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_SECRET)
//       .update(req.body.razorpayOrderId + "|" + req.body.razorpayPaymentId)
//       .digest("hex");

//       console.log("Calculated signature:", expectedSignature);

//       // Verify signature
//       if (expectedSignature === razorpaySignature) {
//         // Parse the webhook payload
//         console.log('lalluuu',razorpaySignature)
//         if(req.body.paymentStatus==='failed'){
//           console.log('payment failed')
//         }else{
//         const paymentData = req.body;

//         const items = [];
//         const cart = await Cart.findOne({ userId: req.body.userId }).populate(
//           "items.productId"
//         );
//         console.log(cart,"<<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>");
//         for (let i = 0; i < cart.items.length; i++) {
//           const item = {
//             productId: cart.items[i].productId._id,
//             productName: cart.items[i].productId.productName,
//             image: cart.items[i].productId.productImage[0],
//             quantity: cart.items[i].quantity,
//             price: cart.items[i].price,
//             totalPrice: cart.items[i].totalPrice,
//             size: cart.items[i].size,
//           };
//           items.push(item);
//         }
//         console.log(items);
//         const user = await User.findById(req.body.userId);
//         const addressIndex = user.addresses.findIndex(
//           (address) => address._id.toString() == req.body.address
//         );
//         if (addressIndex == -1) console.log("Address not found");
//         const address = user.addresses[addressIndex];

//         console.log(req.body);
//         const productOffer = req.body.productOffer || 0;
//         const grandTotal = req.body.grandTotal || req.body.totalAmount; 
//         const discount = req.body.discount || 0;






//         const newOrder = new Order({
//           user: req.body.userId,
//           oid: paymentData.razorpayOrderId,
//           paymentId: paymentData.razorpayPaymentId,
//           items,
//           address,
//           paymentMethod: "razorpay",
//           paymentStatus: "Completed",
//           totalAmount: req.body.totalAmount,
//           orderDate: new Date(),

//           productOffer,
//           grandTotal,
//           discount
//         });

//         const savedOrder = await newOrder.save();

//         //for quantity
       

//         const handleQuantity=newOrder.items.map(async(item)=>{
//           const product=await Product.findById(item.productId)
//           if(product){
//             const sizeStock=product.sizes.find(s=>s.size===item.size)
//             if(sizeStock){
//               sizeStock.stock-=item.quantity
//             }
//             await product.save()
//           }
//         })
//         await Promise.all(handleQuantity)

//         //for quantity
//         console.log("Order saved successfully:", savedOrder);

//         await Cart.findByIdAndDelete(cart._id);

//         return res.json({
//           status: "ok",
//           message: "Payment verified successfully",
//           orderId: paymentData.razorpayOrderId, //
//           items: savedOrder.items,   // Array of ordered items
//           grandTotal: savedOrder.grandTotal || savedOrder.totalAmount,
//         });
//       }
//       } else {
//         // console.log("Signature verification failed");
//         // return res.status(400).json({
//         //   status: "error",
//         //   error: "Invalid signature",
//         // });
//         console.log('Signature verification failed');
    

//       }
//     } catch (error) {
//       console.error("Payment verification error:", error);
      
//       const paymentData = req.body;
    
//       const items = [];
//       const cart = await Cart.findOne({ userId: req.body.userId }).populate("items.productId");
//       console.log(cart, "<<<<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>");
      
//       for (let i = 0; i < cart.items.length; i++) {
//           const item = {
//               productId: cart.items[i].productId._id,
//               productName: cart.items[i].productId.productName,
//               image: cart.items[i].productId.productImage[0],
//               quantity: cart.items[i].quantity,
//               price: cart.items[i].price,
//               totalPrice: cart.items[i].totalPrice,
//               size: cart.items[i].size,
//           };
//           items.push(item);
//       }
      
//       console.log(items);
//       const user = await User.findById(req.body.userId);
//       const addressIndex = user.addresses.findIndex((address) => address._id.toString() == req.body.address);
//       if (addressIndex == -1) console.log("Address not found");
//       const address = user.addresses[addressIndex];
  
//       console.log(req.body);
//       const productOffer = req.body.productOffer || 0;
//       const grandTotal = req.body.grandTotal || req.body.totalAmount; 
//       const discount = req.body.discount || 0;
  
//       const newOrder = new Order({
//           user: req.body.userId,
//           oid: paymentData.razorpayOrderId,
//           paymentId: paymentData.razorpayPaymentId,
//           items,
//           address,
//           paymentMethod: "razorpay",
//           paymentStatus: "failed",
//           totalAmount: req.body.totalAmount,
//           orderDate: new Date(),
//           productOffer,
//           grandTotal,
//           discount
//       });
  
//       // Save the new order regardless of payment success
//       const savedOrder = await newOrder.save();
  
//       return res.json({
//           success: false,
//           message: "Payment failed successfully",
//           orderId: savedOrder.oid, // Use savedOrder.oid to get the order ID
//           items: savedOrder.items,   // Array of ordered items
//           grandTotal: savedOrder.grandTotal || savedOrder.totalAmount,
//       });







//       // return res.status(500).json({
//       //   status: "error",
//       //   error: "Internal server error",
//       // });
//     }
//   }
// );



   

// //everything for razorpay

app.listen(PORT, function () {
  console.log("it is running");
});
