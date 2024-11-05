const Product=require('../../models/productModel.js')
const Category=require('../../models/categoryModel.js')
const User=require('../../models/userModel.js')
const fs=require("fs")
const path=require("path")
const sharp=require("sharp")
const statusCodes=require('../../config/keys.js')


exports.getProduct=async(req,res)=>{
    try {
        const category=await Category.find({isDeleted:false})
        res.render('admin/addProduct',{
            cat:category
        })
    } catch (error) {
        res.send(error)
    }
}



exports.addProducts=async(req,res)=>{
    try {
        const products=req.body
        
        const productExist=await Product.findOne({
            productName:products.productName
        })
        console.log(productExist)
       if(!productExist){
        const images=[]
        if(req.files&&req.files.length>0){
            for(let i=0;i<req.files.length;i++){
                const originalImagePath=req.files[i].path
                const resizedImagePath=path.join('public','uploads','product-images',req.files[i].filename)
                await sharp(originalImagePath).resize({width:440,height:440}).toFile(resizedImagePath)
                images.push(req.files[i].filename)
            }
        }
       
       const category=await Category.findOne({name:products.category })

    const sizeData = Object.entries(products.sizes).map(([size, stock]) => ({
        size:size.toUpperCase(),
        stock: parseInt(stock, 10), 
        }));

       const newProduct=new Product({
          productName:products.productName,
          description:products.description,
        //   brand:products.brand,
          category:category._id,
          regularPrice:products.regularPrice,
          salePrice:products.salePrice,
          createdOn:new Date(),
          quantity:products.quantity,
          sizes: sizeData,
          color:products.color,
          productImage:images,
          status:'Available',
       })
       await newProduct.save()
       return res.redirect('/addProducts')
    }else{
        return res.status(statusCodes.BAD_REQUEST).json("product already exist,please try with another name!")
    }
    } catch (error) {
        console.error("Error occured",error)
        // return res.redirect('/pageerror')
    }
} 


//listing products
exports.getAllProducts=async(req,res)=>{
    try {
        const search=req.query.search||""
        const page=req.query.page||1
        const limit=5

        const productData=await Product.find({
            $or:[
                {productName:{$regex:new RegExp(".*"+search+".*","i")}}
            ]
        })
        .limit(limit*1)
        .skip((page-1)*limit)
        .populate('category')
        .exec()

        const count=await Product.find({
            $or:[
                {productName:{$regex:new RegExp(".*"+search+".*","i")}}
            ]
        }).countDocuments()

        const category=await Category.find({isDeleted:false})

        if(category){
            res.render('admin/products',{
                data:productData,
                currentPage:page,
                totalPages:Math.ceil(count/limit),
                cat:category

            })
        }else{
            res.status(statusCodes.BAD_REQUEST).json('page 404')
        }
        
    } catch (error) {
        console.error(error)
        res.status(statusCodes.INTERNAL_SERVER_ERROR).json("internal server error")
    }
}


exports.addProductOffer=async(req,res)=>{
    try {
        const{productId,percentage}=req.body
        const findProduct=await Product.findOne({_id:productId})
        findProduct.salePrice=findProduct.salePrice-Math.floor(findProduct.regularPrice*(percentage/100))
        findProduct.productOffer=parseInt(percentage)
        await findProduct.save()
        res.json({status:true})
    } catch (error) {
        console.error(error)
        res.status(statusCodes.INTERNAL_SERVER_ERROR).json({success:false,error:"internal server error"})
    }
}

exports.removeProductOffer=async(req,res)=>{
    try {
        const {productId}=req.body
        const findProduct=await Product.findOne({_id:productId})
        const percentage=findProduct.productOffer
        findProduct.salePrice=findProduct.salePrice+Math.floor(findProduct.regularPrice*(percentage/100))
        findProduct.productOffer=0;
        await findProduct.save();
        res.json({status:true})

    } catch (error) {
        res.status(statusCodes.BAD_REQUEST).json({success:false,error:"internal server error"})
    }
}


exports.blockProduct=async(req,res)=>{
    try {
        let id=req.query.id
        await Product.findByIdAndUpdate({_id:id},{$set:{isBlocked:true}})
        res.redirect('/products')
    } catch (error) {
        res.status(statusCodes.BAD_REQUEST).json({success:false,error:"An error in blocking"})
    }
}


exports.unblockProduct=async(req,res)=>{
    try {
        let id=req.query.id
        await Product.findByIdAndUpdate({_id:id},{$set:{isBlocked:false}})
        res.redirect('/products')
    } catch (error) {
        res.status(statusCodes.BAD_REQUEST).json({success:false,error:"An error in blocking"})
    }
}


exports.getEditProduct=async(req,res)=>{
    try {
        let id=req.query.id
        const product=await Product.findOne({_id:id})
        const category=await Category.find({})
        res.render('admin/editProduct',{
            product:product,
            cat:category
        })
    } catch (error) {
        res.status(statusCodes.BAD_REQUEST).json({error:"error while getting page"})
    }
}




exports.editProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const data = req.body;
        console.log(data)

        
        const category = await Category.findOne({ name: data.category });
        if (!category) {
            return res.status(statusCodes.BAD_REQUEST).json({ error: "Category not found!" });
        }

        
        const existingProduct = await Product.findOne({
            productName: data.productName,
            _id: { $ne: id }
        });

        if (existingProduct) {
            return res.status(400).json({ error: "This product already exists!" });
        }
        const sizes = Object.entries(data.sizes).map(([size, stock]) => ({
            size: size.toUpperCase(),
            stock: parseInt(stock, 10), 
        }));
        const updateFields = {
            productName: data.productName,
            category: category._id, 
            regularPrice: data.regularPrice,
            salePrice: data.salePrice,
            quantity: data.quantity,
            sizes: sizes,
            color: data.color,
        };

        
        const images = [];
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                images.push(req.files[i].filename);
            }
            await Product.findByIdAndUpdate(id, {
                $set: updateFields,
                $push: { productImage: { $each: images } }
            }, { new: true });
        } else {  
            await Product.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
        }
        res.redirect('/products');
    } catch (error) {
        console.error(error);
        res.status(statusCodes.INTERNAL_SERVER_ERROR).json({ error:"Error while updating the product" });
    }
};









exports.deleteSingleImage = async (req, res) => {
    try {
        const { imageNameToServer, productIdToServer } = req.body;
        await Product.findByIdAndUpdate(productIdToServer, { $pull: { productImage: imageNameToServer } });
        
        const imagePath = path.join('public', 'uploads', 're-image', imageNameToServer);
        
        if (fs.existsSync(imagePath)) {
            await fs.unlinkSync(imagePath);
            console.log(`Image ${imageNameToServer} deleted successfully`);
        } else {
            console.log(`Image ${imageNameToServer} not found`);
        }
        
        res.send({ status: true });
    } catch (error) {
        res.status(statusCodes.BAD_REQUEST).json({ error: "Error occurred while deleting" });
    }
};