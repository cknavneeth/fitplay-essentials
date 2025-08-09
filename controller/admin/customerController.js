const StatusCodes = require('../../config/keys.js');
const {User} = require('../../models/userModel.js');

exports.listCustomers = async (req, res) => {
    const perPage = 10; 
    const page = req.query.page || 1; 
    const searchQuery = req.query.search || ''; 
  
    try {
      
      const searchCondition = searchQuery
        ? {
            $or: [
              { username: { $regex: searchQuery, $options: 'i' } }, 
              { email: { $regex: searchQuery, $options: 'i' } },    
              { phoneNo: { $regex: searchQuery, $options: 'i' } },  
            ],
          }
        : {};
  
      
      const totalUsers = await User.countDocuments(searchCondition);
  
      
      const users = await User.find(searchCondition)
        .skip((perPage * page) - perPage) 
        .limit(perPage)
        .sort({ _id: -1 }); 
  
      
      res.render('admin/users', {
        users,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / perPage),
        searchQuery, 
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Server Error');
    }
  };



exports.blocking=async (req,res)=>{
    try {
        let id=req.query.id

        const user = await User.findById(id);
        if (!user) {
            console.log("User not found with ID:", id);
            return res.status(StatusCodes.BAD_REQUEST).send('User not found'); // Handle user not found
        }


        const result=await User.updateOne({_id:id},{$set:{isBlocked:true}});
        console.log("result:",result)
        // res.redirect('/users')/
        return res.json({success:true,blocked:true,userId:id})
    } catch (error) {
        res.redirect('/pageerror')
    }
}

exports.unblocking=async(req,res)=>{
    try {
        let id=req.query.id
        const result=await User.updateOne({_id:id},{$set:{isBlocked:false}})
        console.log("result:",result)
        // res.redirect('/users')
        return res.json({success:true,unbloked:true,userId:id})
    } catch (error) {
        res.redirect('/pageerror')
    }
}