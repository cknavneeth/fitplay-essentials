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
    amount: req.body.amount,
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

// app.post('/paymentCapture', express.raw({ type: 'application/json' }), (req, res) => {
//     // Validate signature
//     const data = crypto.createHmac('sha256', secret_key);
//     data.update(req.body);
//     const digest = data.digest('hex');

//     // Compare the calculated digest with the signature in the headers
//     if (digest === req.headers['x-razorpay-signature']) {
//         console.log('Request is legit');

//         // Process the payment and store info in the database
//         res.json({
//             status: 'ok',
//         });
//     } else {
//         console.error('Invalid signature:', req.headers['x-razorpay-signature']);
//         res.status(400).send('Invalid signature');
//     }
// });

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

        // Process the verified payment
        // You should implement your order completion logic here
        // For example, update order status, send confirmation email, etc.

        // {
        //     razorpayPaymentId: 'pay_PKNgLu3ALQ5ZAJ',
        //     razorpayOrderId: 'order_PKNgGrd6lLxQuf',
        //     razorpaySignature: '4d210c6a5bff9fec3f24155a12eafe50553f43b6334d9424832118a5fdb7e170',
        //     address: '67291c5f11afa16b74e151a1',
        //     items: [ { price: 200, quantity: 2 }, { price: 100, quantity: 1 } ],
        //     userId: '6728a1ecff33e425dec6a64f',
        //     paymentMethod: 'razorpay',
        //     totalAmount: 500
        //   }
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
        const productOffer = req.body.productOffer || 0;
        const grandTotal = req.body.grandTotal || req.body.totalAmount; 
        const discount = req.body.discount || 0;






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
          discount
        });

        const savedOrder = await newOrder.save();
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

// app.post('/paymentCapture', express.raw({ type: 'application/json' }), async (req, res) => {
//     try {
//         const razorpaySignature = req.body.razorpaySignature // Typically in headers for webhooks
//         if (!razorpaySignature) {
//             console.log('Signature not found in headers');
//             return res.status(400).json({ error: 'No signature provided' });
//         }

//         const rawBody = req.body; // Raw payload for signature verification
//         console.log('Received webhook raw payload:', rawBody);

//         // Parse raw body to JSON if necessary
//         let paymentData;
//         try {
//             paymentData = JSON.parse(rawBody.toString());
//         } catch (parseError) {
//             console.error('Failed to parse JSON from rawBody:', parseError);
//             return res.status(400).json({ error: 'Invalid JSON in webhook payload' });
//         }

//         console.log('Parsed payment data:', paymentData);

//         // Calculate expected signature
//         const expectedSignature = crypto
//             .createHmac('sha256', process.env.RAZORPAY_SECRET)
//             .update(paymentData.razorpayOrderId + "|" + paymentData.razorpayPaymentId)
//             .digest('hex');

//         console.log('Calculated signature:', expectedSignature);

//         // Verify signature
//         if (expectedSignature === razorpaySignature) {
//             console.log('Signature verified successfully.');

//             // Create a new order in the Order collection with the verified payment details
//             const newOrder = new Order({
//                 user: paymentData.userId,
//                 oid: paymentData.razorpayOrderId,
//                 items: paymentData.items,
//                 address: paymentData.address,
//                 paymentMethod: 'razorpay',
//                 paymentStatus: 'Completed',
//                 orderStatus: 'Processing',
//                 totalAmount: paymentData.totalAmount,
//                 orderDate: new Date()
//             });

//             // Save the new order
//             const savedOrder = await newOrder.save();
//             console.log('Order saved successfully:', savedOrder);

//             return res.json({
//                 status: 'ok',
//                 message: 'Payment verified and order saved successfully',
//                 orderId: paymentData.razorpayOrderId
//             });
//         } else {
//             console.log('Signature verification failed');
//             return res.status(400).json({
//                 status: 'error',
//                 error: 'Invalid signature'
//             });
//         }
//     } catch (error) {
//         console.error('Payment verification error:', error);
//         return res.status(500).json({
//             status: 'error',
//             error: 'Internal server error'
//         });
//     }
// });
// //everything for razorpay

app.listen(PORT, function () {
  console.log("it is running");
});
