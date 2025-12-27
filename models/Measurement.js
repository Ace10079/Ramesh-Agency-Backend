const mongoose = require("mongoose");

const measurementSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MeasurementGroup",
    required: true,
  },
  
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  category: {
    type: String,
    enum: ["Curtains", "Upholstery"],
    required: true,
  },
  subCategory: {
    type: String,
    enum: ["Curtains", "Blinds", "Sofa", "Headboard", "Puffy"],
    required: true,
  },
  style: {
    type: String,
    enum: [
      "Pleated",
      "Eyelet",
      "Ripple Fold",
      "Top Fold",
      "Roman",
      "Roller",
      "Zebra",
      "PVC",
      "Industrial Blinds",
      "Blinds",
      "Standard"
    ],
    // optional for Upholstery items
  },
  // Common fields
  lengthInches: Number, // Required validation handled in route depending on category
  widthInches: Number,
  // Upholstery specific
  seats: Number, // For upholstery sofas
  pieces: Number, // For Puffy items
  // Calculations
  meters: Number,
  panels: Number,
  totalMeters: Number,
  squareFeet: Number,
  trackFeet: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Measurement", measurementSchema);
