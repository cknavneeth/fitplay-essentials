const User = require('../../models/userModel.js');

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
        .limit(perPage); 
  
      
      res.render('admin/users', {
        users,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / perPage),
        searchQuery, 
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).send('Server Error');
    }
  };



exports.blocking=async (req,res)=>{
    try {
        let id=req.query.id

        const user = await User.findById(id);
        if (!user) {
            console.log("User not found with ID:", id);
            return res.status(404).send('User not found'); // Handle user not found
        }


        const result=await User.updateOne({_id:id},{$set:{isBlocked:true}});
        console.log("result:",result)
        res.redirect('/users')
    } catch (error) {
        res.redirect('/pageerror')
    }
}

exports.unblocking=async(req,res)=>{
    try {
        let id=req.query.id
        const result=await User.updateOne({_id:id},{$set:{isBlocked:false}})
        console.log("result:",result)
        res.redirect('/users')
    } catch (error) {
        res.redirect('/pageerror')
    }
}