const Product=require('../../models/productModel.js')
const Category=require('../../models/categoryModel.js')
const Order=require('../../models/orderModel.js')
const User=require('../../models/userModel.js')
const fs=require("fs")
const path=require("path")
const sharp=require("sharp")
const statusCodes=require('../../config/keys.js')

// const {getsalesReport}=require('../admin/salesController.js')
const moment=require('moment')


const getSalesReport=async(filter, start, end)=>{
    let startDate, endDate;

    if (filter === 'custom' && start && end) {
        startDate = new Date(start);
        endDate = new Date(end);
    } else{
    switch(filter){
        case 'daily':
            startDate = moment().startOf('day').toDate();
            endDate=moment().endOf('day').toDate()
            break;
        case 'weekly':
            startDate=moment().startOf('week').toDate()
            endDate=moment().endOf('week').toDate()
            break;
        case 'monthly':
            startDate=moment().startOf('month').toDate()
            endDate=moment().endOf('month').toDate()
            break;
        case 'yearly':
            startDate=moment().startOf('year').toDate()
            endDate=moment().endOf('year').toDate()
            break;   
            
        default:
            startDate=moment().startOf('year').toDate()
            endDate=moment().endOf('year').toDate()
            break;    
    }
    }

    try {
        const order=await Order.aggregate([
            {
                $match:{
                    orderDate:{
                        $gte:startDate,
                        $lte:endDate
                    }
                }
            },
            {
                $group:{
                    _id:null,
                    totalOrders:{$sum:1},
                    totalAmount:{$sum:'$totalAmount'},
                    totalCoupondiscount:{$sum:'$discount'},
                    totalCancelledOrders:{
                        $sum:{$cond:[{$eq:['$orderStatus','Cancelled']},1,0]}
                    },
                    totalReturnedOrders:{
                        $sum:{$cond:[{$eq:['$orderStatus','Returned']},1,0]}
                    },
                    totalShippedOrders:{
                        $sum:{$cond:[{$eq:['$orderStatus','Shipped']},1,0]}
                    },
                    totalDeliveredOrders:{
                         $sum:{$cond:[{$eq:['$orderStatus','Delivered']},1,0]}
                    },
                    totalProductOffers:{
                        $sum:'$productOffer'
                    },
                    totalCategoryOffer:{
                        $sum:'$categoryOffer'
                    }
                }
            }
        ])
        return order[0]
    } catch (error) {
        console.error('error fetching results',error)
        return null
    }
}

exports.getDashboard = async (req, res) => {
    console.log('arshad')
    try {
        console.log('IVDE')
        const filter = 'yearly';

        const report = await getSalesReport(filter);

        console.log('Report:', report); // Debug log

        res.render('admin/dashboard', {
            report: report || {
                totalOrders: 0,
                totalAmount: 0,
                totalDeliveredOrders: 0,
                totalCancelledOrders: 0,
                totalReturnedOrders: 0,
            },
        });
    } catch (error) {
        console.error(error);
        res.render('admin/dashboard', {
            report: {
                totalOrders: 0,
                totalAmount: 0,
                totalDeliveredOrders: 0,
                totalCancelledOrders: 0,
                totalReturnedOrders: 0,
            },
        });
    }
};
