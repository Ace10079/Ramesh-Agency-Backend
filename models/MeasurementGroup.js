const mongoose = require("mongoose");

const measurementGroupSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  groupNumber: {
    type: Number, // 1, 2, 3
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent duplicate group numbers per order
measurementGroupSchema.index(
  { orderId: 1, groupNumber: 1 },
  { unique: true }
);

module.exports = mongoose.model("MeasurementGroup", measurementGroupSchema);
