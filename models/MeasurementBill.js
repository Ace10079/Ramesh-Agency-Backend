const mongoose = require("mongoose");

const MeasurementItemSchema = new mongoose.Schema({
  measurementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Measurement",
    required: true
  },

  productName: String,
  category: String,
  subCategory: String,

  totalMeters: { type: Number, default: 0 },
  squareFeet: { type: Number, default: 0 },

  unitPrice: { type: Number, required: true },
  total: { type: Number, required: true }
});

const MeasurementBillSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true
  },

  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true
  },

  customerSnapshot: {
    name: String,
    mobile: String,
    address: String
  },

  items: [MeasurementItemSchema],

  grandTotal: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "REJECTED"],
    default: "PENDING"
  },

  rejectionReason: String,

  billLinkToken: {
    type: String,
    index: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("MeasurementBill", MeasurementBillSchema);
