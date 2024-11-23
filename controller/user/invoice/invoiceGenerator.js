const PDFDocument = require('pdfkit');
const fs = require('fs');

function generatorInvoice(order, outputPath) {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(fs.createWriteStream(outputPath));

    // Add a border and a company header
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();
    doc.fontSize(20).fillColor('#0073e6').text('Fitplay Essentials', { align: 'center' }).moveDown(0.5);
    doc.fontSize(12).fillColor('black').text('Address: newYork city Business St, Commerce Evolution building, 10010', { align: 'center' });
    doc.text('Phone: +1-234-567-890 | Email: fitplayEssentials@gmail.com', { align: 'center' });
    doc.moveDown(1);

    // Invoice title
    doc.fontSize(18).fillColor('#333333').text('Invoice', { align: 'center', underline: true }).moveDown(1);

    // Order Information Section
    doc.fontSize(12).fillColor('black').text('Order Details:', { bold: true });
    doc.moveDown(0.5);
    doc.text(`Order ID: ${order._id}`, { indent: 20 });
    doc.text(`Order Date: ${new Date(order.orderDate).toLocaleDateString()}`, { indent: 20 });
    doc.text(`Payment Method: ${order.paymentMethod}`, { indent: 20 });
    doc.text(`Order Status: ${order.orderStatus}`, { indent: 20 });
    doc.moveDown(1);

    // Customer Information Section
    doc.text('Customer Details:', { bold: true });
    doc.moveDown(0.5);
    const formattedAddress = `${order.address.locality}, ${order.address.city}, ${order.address.state}, ${order.address.pincode}`;
    doc.text(`Name: ${order.address.name}`, { indent: 20 });
    doc.text(`Address: ${formattedAddress}`, { indent: 20 });
    doc.moveDown(1);

    // Table Header with Borders and Background
    doc.text('Order Items:', { underline: true }).moveDown(0.5);

    const tableTop = doc.y;
    const columnWidths = [40, 200, 80, 80, 100];

    doc.rect(50, tableTop - 5, 500, 20).fill('#f2f2f2').stroke();
    doc.fillColor('#333333')
        .fontSize(10)
        .text('S.No', 55, tableTop, { width: columnWidths[0], align: 'center' })
        .text('Item', 95, tableTop, { width: columnWidths[1], align: 'left' })
        .text('Quantity', 295, tableTop, { width: columnWidths[2], align: 'center' })
        .text('Price', 375, tableTop, { width: columnWidths[3], align: 'right' })
        .text('Subtotal', 475, tableTop, { width: columnWidths[4], align: 'right' });

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
    doc.moveDown();

    // Order Items Rows with Alternating Colors
    let totalAmount = 0;
    order.items.forEach((item, index) => {
        const rowTop = doc.y;
        const subtotal = item.quantity * item.totalPrice;
        totalAmount += subtotal;

        // Alternate row color
        if (index % 2 === 0) {
            doc.rect(50, rowTop - 2, 500, 20).fill('#f9f9f9').stroke();
        }

        doc.fillColor('black')
            .text(`${index + 1}`, 55, rowTop, { width: columnWidths[0], align: 'center' })
            .text(item.productName, 95, rowTop, { width: columnWidths[1], align: 'left', ellipsis: true })
            .text(item.quantity.toString(), 295, rowTop, { width: columnWidths[2], align: 'center' })
            .text(`₹${item.totalPrice.toFixed(2)}`, 375, rowTop, { width: columnWidths[3], align: 'right' })
            .text(`₹${subtotal.toFixed(2)}`, 475, rowTop, { width: columnWidths[4], align: 'right' });

        doc.moveDown(0.5);
    });

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);

    // Summary Section
    doc.fontSize(12).fillColor('#333333').text('Summary:', { underline: true });
    doc.moveDown(0.5);
    doc.text(`Subtotal: ₹${totalAmount.toFixed(2)}`, { indent: 20 });
    doc.text(`Shipping: ₹${order.shipping || 0}`, { indent: 20 });
    doc.fontSize(14).fillColor('#0073e6').text(`Grand Total: ₹${order.grandTotal}`, { indent: 20, bold: true });

    
    doc.moveDown(3);
    doc.fontSize(10).fillColor('black').text('Thank you for shopping with us!', { align: 'center' });

    // Finalize the document
    doc.end();
}

module.exports = generatorInvoice;



