const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true
  },

  unit: {
    type: String,
    enum: ["pcs", "mtrs", "roll", "set", "box", "custom"],
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  category: {
    type: String,
    enum: [
      "Curtains",
      "Sofa Cover",
      "Bedsheet",
      "Pillow Cover",
      "Tracks",
      "Accessories"
    ],
    default: "Curtains"
  },

  description: {
    type: String,
    default: ""
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Product", productSchema);
