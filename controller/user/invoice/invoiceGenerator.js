const PDFDocument=require('pdfkit')
const fs = require('fs');
const path = require('path')


function generatorInvoice(order,outputPath){
 const doc=new PDFDocument()
 doc.pipe(fs.createWriteStream(outputPath));

 // Header
 doc.fontSize(20).text('Invoice', { align: 'center' });
 doc.moveDown();

 // Order Details
 doc.fontSize(12).text(`Order ID: ${order._id}`);
 doc.text(`Order Date: ${new Date(order.orderDate).toLocaleDateString()}`);
 doc.text(`Payment Method: ${order.paymentMethod}`);
 doc.text(`Order Status: ${order.orderStatus}`);
 doc.moveDown();

 // Customer Information
 doc.text(`Customer Name: ${order.address.name}`);
 doc.text(`Address: ${order.address}`);
 doc.moveDown();

 // Table Header
 doc.fontSize(12).text('Items:', { underline: true });
 doc.moveDown(0.5);
 doc.text('S.No', { continued: true, width: 50 });
 doc.text('Item', { continued: true, width: 150 });
 doc.text('Quantity', { continued: true, width: 100 });
 doc.text('Price', { continued: true, width: 100 });
 doc.text('Subtotal', { width: 100 });
 doc.moveDown();

 // Order Items
 let totalAmount = 0;
 order.items.forEach((item, index) => {
     const subtotal = item.quantity * item.totalPrice;
     totalAmount += subtotal;

     doc.text(`${index + 1}`, { continued: true, width: 50 });
     doc.text(item.productName, { continued: true, width: 150 });
     doc.text(item.quantity.toString(), { continued: true, width: 100 });
     doc.text(`₹${item.totalPrice.toFixed(2)}`, { continued: true, width: 100 });
     doc.text(`₹${subtotal.toFixed(2)}`, { width: 100 });
 });

 doc.moveDown(1);

 // Total Section
 doc.fontSize(14).text('Summary:', { underline: true });
 doc.text(`Subtotal: ₹${totalAmount.toFixed(2)}`);
 doc.text(`Shipping: ₹${order.shipping || 0}`);
 doc.text(`Grand Total: ₹${order.grandTotal}`);

 // Footer
 doc.moveDown(2);
 doc.fontSize(10).text('Thank you for shopping with us!', { align: 'center' });

 // Finalize the document
 doc.end();
}

module.exports=generatorInvoice