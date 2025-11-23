const nodemailer = require("nodemailer");

async function sendBillEmail(toEmail, bill, pdfUrl, shopInfo = {}) {
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
  const backendBase = process.env.BACKEND_URL || "";

  const html = `
    <p>Hello ${bill.customerSnapshot.name || "Customer"},</p>
    <p>Your invoice from <strong>${shopInfo.name || process.env.SHOP_NAME || "My Shop"}</strong> is ready.</p>

    <p><a href="${customerLink}" style="padding:10px 15px;background:#2563eb;color:white;text-decoration:none;border-radius:6px;">View & Pay Invoice</a></p>

    <p>You can also download your PDF invoice:</p>
    <p><a href="${backendBase}${pdfUrl}">Download PDF</a></p>

    <p>Thank you.</p>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: toEmail,
    subject: `Invoice from ${shopInfo.name || process.env.SHOP_NAME}`,
    html,
  });
}

module.exports = sendBillEmail;
