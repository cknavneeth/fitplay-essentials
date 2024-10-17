const User = require('../../models/userModel.js');

exports.listCustomers = async (req, res) => {
    const perPage = 10; // Number of users per page
    const page = req.query.page || 1; // Current page, default is 1
    const searchQuery = req.query.search || ''; // Search term
  
    try {
      // Search condition: Check if there's a search query for username, email, or phone
      const searchCondition = searchQuery
        ? {
            $or: [
              { username: { $regex: searchQuery, $options: 'i' } }, // Case-insensitive search for username
              { email: { $regex: searchQuery, $options: 'i' } },    // Case-insensitive search for email
              { phoneNo: { $regex: searchQuery, $options: 'i' } },  // Case-insensitive search for phone number
            ],
          }
        : {};
  
      // Get the total number of users that match the search condition
      const totalUsers = await User.countDocuments(searchCondition);
  
      // Fetch users that match the search condition with pagination
      const users = await User.find(searchCondition)
        .skip((perPage * page) - perPage) // Skip records based on current page
        .limit(perPage); // Limit the number of records
  
      // Render the customer page with user data, current page, total pages, and search term
      res.render('admin/users', {
        users,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / perPage),
        searchQuery, // Pass the search query to the view so it can be pre-filled in the search box
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