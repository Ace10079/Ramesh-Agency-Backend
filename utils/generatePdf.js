const PDFDocument = require("pdfkit");
const fs = require("fs-extra");
const path = require("path");

async function generateBillPdf(bill, shopInfo = {}, outDir = path.join(__dirname, "..", "uploads", "bills")) {
  await fs.ensureDir(outDir);

  const filename = `bill-${bill._id}.pdf`;
  const filePath = path.join(outDir, filename);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header - shop
      doc.fontSize(18).text(shopInfo.name || "My Shop", { align: "left" });
      if (shopInfo.address) doc.fontSize(10).text(shopInfo.address);
      if (shopInfo.phone) doc.text(`Phone: ${shopInfo.phone}`);
      doc.moveDown();

      // Bill meta
      doc.fontSize(12).text("Invoice / Bill", { align: "right" });
      doc.fontSize(10).text(`Bill ID: ${bill._id}`, { align: "right" });
      doc.text(`Date: ${new Date(bill.createdAt).toLocaleString()}`, { align: "right" });
      doc.moveDown();

      // Customer
      doc.fontSize(12).text("Bill To:");
      doc.fontSize(10).text(bill.customerSnapshot.name || "");
      if (bill.customerSnapshot.address) doc.text(bill.customerSnapshot.address);
      if (bill.customerSnapshot.mobile) doc.text(bill.customerSnapshot.mobile);
      doc.moveDown();

      // Items table
      doc.fontSize(11).text("Items:");
      doc.moveDown(0.3);

      bill.items.forEach((it, i) => {
        const name = it.productName;
        const qty = it.quantity || 0;
        const price = it.price || 0;
        const total = it.total || qty * price;

        doc.fontSize(10).text(`${i + 1}. ${name}`, { continued: true });
        doc.text(`  Qty: ${qty}  Price: ₹${price.toFixed ? price.toFixed(2) : price}  Total: ₹${total.toFixed ? total.toFixed(2) : total}`);
        doc.moveDown(0.2);
      });

      doc.moveDown(0.8);
      doc.fontSize(12).text(`Grand Total: ₹${(bill.grandTotal || 0).toFixed(2)}`, { align: "right" });
      doc.moveDown();

      if (shopInfo.upi) {
        doc.fontSize(10).text(`Pay UPI: ${shopInfo.upi}`);
      }

      doc.end();

      stream.on("finish", () => resolve({ filename, filePath }));
      stream.on("error", (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = generateBillPdf;
