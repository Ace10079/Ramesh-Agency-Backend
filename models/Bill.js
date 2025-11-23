const mongoose = require("mongoose");

// Define BillItemSchema first
const BillItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  price: { type: Number, required: true }, // price per unit
  total: { type: Number, required: true }, // quantity * price
});

// Then define BillSchema
const BillSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  customerSnapshot: {
    name: String,
    email: String,
    mobile: String,
    address: String,
  },
  items: [BillItemSchema],
  grandTotal: { type: Number, required: true },
  status: {
    type: String,
    enum: ["PENDING", "APPROVED_PENDING_PAYMENT", "APPROVED", "REJECTED", "PAID", "PARTIALLY_PAID"],
    default: "PENDING",
  },
  rejectionReason: { type: String, default: "" },
  billLinkToken: { type: String, index: true },
  pdfFilename: { type: String, default: "" },
  payments: [
    {
      method: String,
      amount: Number,
      paidAt: Date,
      ref: String,
      upiId: String, // Add UPI payment details
      transactionId: String,
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Bill", BillSchema);