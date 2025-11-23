const nodemailer = require("nodemailer");

async function sendBillEmail(toEmail, bill) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const customerLink = `${process.env.CUSTOMER_SITE_URL}/bill/${bill.billLinkToken}`;
  const pdfUrl = `/uploads/bills/${bill.pdfFilename}`;

  const html = `
    <p>Hello ${bill.customerSnapshot.name},</p>
    <p>Your invoice from <strong>${process.env.SHOP_NAME}</strong> is ready.</p>

    <p><a href="${customerLink}" 
      style="padding:10px 15px;background:#2563eb;color:white;text-decoration:none;border-radius:6px;">
      View & Pay Invoice
    </a></p>

    <p>You can also download the PDF:</p>
    <a href="${process.env.BACKEND_URL}${pdfUrl}">Download PDF</a>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || "no-reply@yourshop.com",
    to: toEmail,
    subject: `Invoice from ${process.env.SHOP_NAME}`,
    html,
  });
}

module.exports = sendBillEmail;
