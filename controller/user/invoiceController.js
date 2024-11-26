const path = require('path');
const fs = require('fs');
const Order = require('../../models/orderModel');
const generateInvoice = require('../user/invoice/invoiceGenerator');

exports.getInvoice = async (req, res) => {
    try {
        const orderId = req.params.orderId;

        const order = await Order.findById(orderId).populate('items.productId');
        if (!order) {
            return res.status(400).json({ success: false, error: 'Order not found' });
        }
        const invoiceDir = path.join(__dirname, '../../invoices');
        if (!fs.existsSync(invoiceDir)) {
            fs.mkdirSync(invoiceDir); 
        }
        const invoicePath = path.join(invoiceDir, `${orderId}.pdf`);

        await generateInvoice(order, invoicePath);

        res.download(invoicePath, `Invoice_${orderId}.pdf`, (err) => {
            if (err) {
                console.error(err);
                res.status(500).send('Could not download the file');
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};
