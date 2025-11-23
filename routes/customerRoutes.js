const express = require("express");
const Customer = require("../models/Customer");
const router = express.Router();

// Create Customer
router.post("/create", async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.json({ success: true, customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all customers
router.get("/list", async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
