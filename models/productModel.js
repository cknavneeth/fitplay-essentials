const mongoose = require("mongoose");
const {Schema} = mongoose;


const productSchema = new Schema({
    productName : {
        type: String,
        required:true,
    },
    description: {
        type :String,
        required:true,
    },
    // brand: {
    //     type:String,
    //     required:true,
    // },
    category: {
        type:Schema.Types.ObjectId,
        ref:"Category",
        required:false,
    },
    regularPrice:{
        type:Number,
        // type:String,

        required:true,
    },
    salePrice:{
        type:Number,
        // type:String,

        required:true 
    },
    productOffer : {
        type:Number,
        // type:String,

        default:0,
    },
    quantity:{ 
        type:String
        // type:Number, 
        // default:true
    },
    color: {
        type:String,
        required:false
    },
    productImage:{  
        type:[String],
        required:true
    }, 
    isBlocked:{
        type:Boolean,
        default:false
    },
    status:{
        type:String,
        enum:["Available","out of stock","Discountinued"],
        required:true,
        default:"Available"
    },
    sizes : [
        {
            size : {
                type : String,
                enum : ['S','M','L',"XL"],
                required : true,
            },
            stock : {
                // type : Number,
                type:String,
                // required : true,
                min : 0,
            }
              }
          ]
},{timestamps:true});

const Product = mongoose.model("Product",productSchema);

module.exports = Product;


