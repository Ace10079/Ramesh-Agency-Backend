// models/Order.js
const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  productName: String,
  quantity: { type: Number, default: 1 },
  price: { type: Number, required: true },
  total: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  items: [orderItemSchema],
  grandTotal: { type: Number, required: true },
  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED"],
    default: "PENDING"
  },
  billId: { type: mongoose.Schema.Types.ObjectId, ref: "Bill" }, // Link to bill
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", orderSchema);