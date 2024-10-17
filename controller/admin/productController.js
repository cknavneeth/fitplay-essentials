const Product=require('../../models/productModel.js')
const Category=require('../../models/categoryModel.js')
const User=require('../../models/userModel.js')
const fs=require("fs")
const path=require("path")
const sharp=require("sharp")


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
    //    console.log(categoryId)
    //    if(!categoryId){
    //     return res.status(400).json("invalid category ")
    //    }

    // const sizes = products.sizes; // Access the sizes object
    // const sizeData = {
    //     S: sizes['s'] || 0, // Set to 0 if not provided
    //     M: sizes['m'] || 0,
    //     L: sizes['l'] || 0,
    //     XL: sizes['xl'] || 0
    // };
    const sizeData = Object.entries(products.sizes).map(([size, stock]) => ({
        size:size.toUpperCase(),
        stock: parseInt(stock, 10), // Convert stock to a number
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
        return res.status(400).json("product already exist,please try with another name!")
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
            res.status(400).json('page 404')
        }
        
    } catch (error) {
        console.error(error)
        res.status(500).json("internal server error")
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
        res.status(500).json({success:false,error:"internal server error"})
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
        res.status(500).json({success:false,error:"internal server error"})
    }
}

//block product
exports.blockProduct=async(req,res)=>{
    try {
        let id=req.query.id
        await Product.findByIdAndUpdate({_id:id},{$set:{isBlocked:true}})
        res.redirect('/products')
    } catch (error) {
        res.status(400).json({success:false,error:"An error in blocking"})
    }
}

//unblock product
exports.unblockProduct=async(req,res)=>{
    try {
        let id=req.query.id
        await Product.findByIdAndUpdate({_id:id},{$set:{isBlocked:false}})
        res.redirect('/products')
    } catch (error) {
        res.status(400).json({success:false,error:"An error in blocking"})
    }
}

// get edit page
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
        res.status(400).json({error:"error while getting page"})
    }
}

// //edit products
// exports.editProduct=async(req,res)=>{
//     try {
//         const id=req.params.id
//         const product=await Product.findOne({_id:id})
//         const data=req.body
//         const existingProduct=await Product.findOne({
//             productName:data.productName,
//             _id:{$ne:id}
//         })
//         if(existingProduct){
//             return res.status(400).json({error:"This product is already exist dude!"})
//         }
//         const images=[]
//         if(req.files&&req.files.length>0){
//             for(let i=0;i<req.files.length;i++){
//                 images.push(req.files[i].filename)
//             }
//         }
//         const updateFields={
//             productName:data.productName,
//             category:data.category,
//             regularPrice:data.regularPrice,
//             salePrice:data.salePrice,
//             quantity:data.quantity,
//             size:data.size,
//             color:data.color
//         }
//         if(req.files.length>0){
//             updateFields.$push={productImage:{$each:images}}
//         }
//         await Product.findByIdAndUpdate(id,updateFields,{new:true})
//         res.redirect('/products')
//     } catch (error) {
//         console.error(error)
//         res.status(500).json({error:"error while updating"})
//     }
// }


exports.editProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const data = req.body;
        console.log(data)

        // Find the category ObjectId based on the category name
        const category = await Category.findOne({ name: data.category });
        console.log(category)
        if (!category) {
            return res.status(400).json({ error: "Category not found!" });
        }

        // Check if a product with the same name exists (excluding the current product)
        const existingProduct = await Product.findOne({
            productName: data.productName,
            _id: { $ne: id }
        });

        if (existingProduct) {
            return res.status(400).json({ error: "This product already exists!" });
        }
        const size = Object.entries(data.sizes).map(([size, stock]) => ({
            size: size.toUpperCase(),
            stock: parseInt(stock, 10), // Convert stock to a number
        }));

        // Prepare the updated fields
        const updateFields = {
            productName: data.productName,
            category: category._id, // Use the ObjectId of the category
            regularPrice: data.regularPrice,
            salePrice: data.salePrice,
            quantity: data.quantity,
            size: size,
            color: data.color,
        };

        // Handle file uploads
        const images = [];
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                images.push(req.files[i].filename);
            }

            // Apply the $push operator for product images
            await Product.findByIdAndUpdate(id, {
                $set: updateFields,
                $push: { productImage: { $each: images } }
            }, { new: true });
        } else {
            // If no new images are uploaded, just update the fields
            await Product.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
        }

        // Redirect after successful update
        res.redirect('/products');
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error while updating the product" });
    }
};








//deleteSingleImage
// exports.deleteSingleImage=async(req,res)=>{
//     try {
//         const{imageNameToServer,productIdToServer}=req.body
//         await Product.findByIdAndUpdate(productIdToServer,{$pull:{productImage:imageNameToServer}}) 
//         const imagePath=("public","uploads","re-image",imageNameToServer)
//         if(fs.existsSync(imagePath)){
//             await fs.unlinkSync(imagePath)
//             console.log(`image ${imageNameToServer} is deleted succesfully` )
//         }else{
//             console.log(`image ${imageNameToServer} not found` )
//         }
//         res.send({status:true})
//     } catch (error) {
//         res.status(400).json({error:"error occured while deleting"})
//     }
// }
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
        res.status(400).json({ error: "Error occurred while deleting" });
    }
};