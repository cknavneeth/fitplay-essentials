const StatusCodes = require('../../config/keys.js');
const Category = require('../../models/categoryModel.js');
const statusCodes=require('../../config/keys.js')
const mongoose=require('mongoose')



exports.categoryInfo=async (req,res)=>{
    try {
        const page=parseInt(req.query.page)||1
        const limit=4
        const skip=(page-1)*limit

        const categoryData=await Category.find({isDeleted:false})
        .sort({createdAt:-1})
        .skip(skip)
        .limit(limit)

        const totalCategory=await Category.countDocuments()

        const totalPages=Math.ceil(totalCategory/limit)

        res.render('admin/category',{
            cat:categoryData,
            currentPage:page,
            totalPages:totalPages,
            totalCategory:totalCategory
        })
    } catch (error) {
        console.error(error)
        res.redirect('/pageerror')
    }
}




exports.addCategory = async (req, res) => {
    const { name, description } = req.body
  
    if (!name || !description) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "name and description are required" })
    }
  
    try {
      const existingCategory = await Category.findOne({ name: { $regex: `^${name}$`, $options: 'i' } })
      
      if (existingCategory) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: "category already exists" })
      }
  
      const newCategory = new Category({
        name,
        description,
      })
      await newCategory.save();
      return res.json({ error: "category added successfully" })
    } catch (error) {
      console.error(error)
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "internal server error" })
    }
  }


  //get edit category
  exports.getEditCategory=async(req,res)=>{
    try {
        let id=req.query.id
        const category=await Category.findById(id)
        res.render('admin/editCategory',{category:category})
    } catch (error) {
      
         res.redirect('/pageerror');
    }

  }




  //editCategfory
  exports.editCategory=async(req,res)=>{
    try {
        let id=req.params.id
        const {categoryName,description}=req.body
        const exitingCategory=await Category.findOne({ name: categoryName });
        if(exitingCategory){
            
            const category = await Category.findById(id); 
            return res.render('admin/editCategory', {
              category: category,
              error: "This category name already exists, please use another."
            });
        }
        const updateCategory=await Category.findByIdAndUpdate(id,{
            name:categoryName,
            description:description
        },{new:true})

        if(updateCategory){
            res.redirect('/category')
        }else{
            res.status(statusCodes.BAD_REQUEST).json({error:"category not found"})
        }
    } catch (error) {
        res.status(statusCodes.INTERNAL_SERVER_ERROR).json({error:"internal server error"})
    }
  }


  //deleteing category
  exports.deleteCat=async(req,res)=>{
    try {
      const categoryId=req.params.id
      await Category.findByIdAndUpdate(categoryId,{isDeleted:true})
      // res.redirect('/category')
      res.status(statusCodes.OK).json({ success: true, message: "Category deleted successfully" });

    } catch (error) {
      console.log(error)
      res.status(statusCodes.INTERNAL_SERVER_ERROR).json({error:"error while delete"})
    }
  }
