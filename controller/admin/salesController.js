const Product=require('../../models/productModel.js')
const Category=require('../../models/categoryModel.js')
const Order=require('../../models/orderModel.js')
const User=require('../../models/userModel.js')
const fs=require("fs")
const path=require("path")
const sharp=require("sharp")
const statusCodes=require('../../config/keys.js')
const PDFDocument = require('pdfkit');

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


exports.getsalesReport=async(req,res)=>{
    try {
        const filter=req.query.filter||'daily'
        const start = req.query.start || null;
        const end = req.query.end || null;

        const report=await getSalesReport(filter,start,end)

        if(!report){
           return res.render('admin/salesReport', {
                report: null,
                filter: filter,
                message:'no result found for the search'
            });
        }

            res.render('admin/salesReport',{
                report:report,
                filter:filter,
                
            })
        
        // res.render('admin/salesreport')
    } catch (error) {
        console.error(error)
        res.render('admin/salesReport',{
            report:null,
            filter:filter,
            message:'error occured ',
            
        })
    }
}




exports.downloadSalesReportPdf = async (req, res) => {
    try {
      const filter = req.query.filter || 'daily';
      const start = req.query.start || null;
      const end = req.query.end || null;
  
      // Fetch the sales report data
      const report = await getSalesReport(filter, start, end);
  
      if (!report) {
        return res.status(404).send('No report data available');
      }
  
      // Create a new PDF document
      const doc = new PDFDocument();
  
      // Set the response headers to indicate a PDF download
      res.setHeader('Content-Disposition', 'attachment; filename="sales-report.pdf"');
      res.setHeader('Content-Type', 'application/pdf');
  
      // Pipe the PDF document to the response
      doc.pipe(res);
  
      // Title
      doc.fontSize(20).text('Sales Report', { align: 'center' });
  
      // Add sales report data to the PDF
      doc.fontSize(12).text(`Total Orders: ${report.totalOrders}`);
      doc.text(`Total Amount: Rs${report.totalAmount}`);
      doc.text(`Total Coupon Discount: Rs${report.totalCoupondiscount}`);
      doc.text(`Total Delivered Orders: ${report.totalDeliveredOrders}`);
      doc.text(`Total Returned Orders: ${report.totalReturnedOrders}`);
      doc.text(`Total Shipped Orders: ${report.totalShippedOrders}`);
      doc.text(`Total Product Offers: Rs${report.totalProductOffers}`);
  
      // Finalize the PDF and end the stream
      doc.end();
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).send('Error generating PDF');
    }
  };