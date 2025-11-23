const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const Bill = require("../models/Bill");

// Create order (optional separate resource)
router.post("/create", async (req, res) => {
  try {
    const { customerId, items } = req.body;
    if (!customerId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "customerId and items required" });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    let grandTotal = 0;
    const builtItems = [];

    for (const it of items) {
      const prod = await Product.findById(it.productId);
      if (!prod) return res.status(404).json({ message: `Product ${it.productId} not found` });

      const qty = Number(it.quantity || 0);
      const total = qty * prod.price;

      builtItems.push({
        productId: prod._id,
        productName: prod.productName,
        quantity: qty,
        price: prod.price,
        total,
      });

      grandTotal += total;
    }

    const order = await Order.create({
      customerId,
      items: builtItems,
      grandTotal,
    });

    res.json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// List orders
router.get("/list", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).populate("customerId", "name email mobile");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.get("/:id", async (req, res) => {
    try {
      const order = await Order.findById(req.params.id)
        .populate("customerId", "name email mobile address");
      if (!order) return res.status(404).json({ message: "Order not found" });
      res.json(order);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  // Sync order status from bill
  router.patch("/:id/sync-status", async (req, res) => {
    try {
      const order = await Order.findById(req.params.id);
      if (!order) return res.status(404).json({ message: "Order not found" });
  
      if (order.billId) {
        const bill = await Bill.findById(order.billId);
  
        if (bill) {
          const statusMap = {
            PENDING: "PENDING",
            APPROVED_PENDING_PAYMENT: "APPROVED",
            APPROVED: "APPROVED",
            REJECTED: "REJECTED",
            PAID: "COMPLETED",
            PARTIALLY_PAID: "APPROVED"
          };
  
          order.status = statusMap[bill.status] || "PENDING";
          await order.save();
        }
      }
  
      // ✅ VERY IMPORTANT LINE
      const populatedOrder = await Order.findById(order._id)
        .populate("customerId", "name email mobile address");
  
      res.json({ success: true, order: populatedOrder });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  });
  
  // Update order status directly
  router.patch("/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
  
      const order = await Order.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      ).populate("customerId", "name email mobile address");  // ✅ ADD THIS
  
      if (!order) return res.status(404).json({ message: "Order not found" });
  
      res.json({ success: true, order });
  
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  

module.exports = router;
