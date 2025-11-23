const express = require("express");
const router = express.Router();
const Bill = require("../models/Bill");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const genToken = require("../utils/genToken");

// ------------------------------
// CREATE BILL (WITH ORDER OPTION)
// ------------------------------
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
        total
      });

      grandTotal += total;
    }

    const token = genToken(12);

    // Create Bill
    const bill = await Bill.create({
      customerId,
      customerSnapshot: {
        name: customer.name,
        email: customer.email,
        mobile: customer.mobile,
        address: customer.address
      },
      items: builtItems,
      grandTotal,
      billLinkToken: token,
      status: "PENDING"
    });

    // Create Order
    const order = await Order.create({
      customerId,
      items: builtItems,
      grandTotal,
      billId: bill._id,
      status: "PENDING"
    });

    res.json({ success: true, bill, order });

  } catch (err) {
    console.error("❌ Error creating bill:", err);
    res.status(500).json({ message: err.message });
  }
});

// ------------------------------
// LIST BILLS
// ------------------------------
router.get("/list", async (req, res) => {
  try {
    const bills = await Bill.find().sort({ createdAt: -1 }).populate("customerId", "name email mobile");
    res.json(bills);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ------------------------------
// GET BILL BY ID
// ------------------------------
router.get("/:id", async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: "Bill not found" });
    res.json(bill);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ------------------------------
// GET BILL BY TOKEN (Customer View)
// ------------------------------
router.get("/token/:token", async (req, res) => {
  try {
    const bill = await Bill.findOne({ billLinkToken: req.params.token });
    if (!bill) return res.status(404).json({ message: "Bill not found" });
    res.json(bill);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ------------------------------
// APPROVE BILL
// ------------------------------
router.patch("/:id/approve", async (req, res) => {
  try {
    const bill = await Bill.findByIdAndUpdate(
      req.params.id,
      { status: "APPROVED_PENDING_PAYMENT" },
      { new: true }
    );
    if (!bill) return res.status(404).json({ message: "Bill not found" });
    res.json({ success: true, bill });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ------------------------------
// REJECT BILL
// ------------------------------
router.patch("/:id/reject", async (req, res) => {
  try {
    const { reason } = req.body;
    const bill = await Bill.findByIdAndUpdate(
      req.params.id,
      { status: "REJECTED", rejectionReason: reason || "" },
      { new: true }
    );
    if (!bill) return res.status(404).json({ message: "Bill not found" });
    res.json({ success: true, bill });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ------------------------------
// ADD ADVANCE PAYMENT
// ------------------------------
router.patch("/:id/advance", async (req, res) => {
  try {
    const { amount, upiId, transactionId } = req.body;
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: "Bill not found" });

    if (bill.status !== "APPROVED_PENDING_PAYMENT") {
      return res.status(400).json({ message: "Bill must be approved first before making payment" });
    }

    bill.payments.push({
      amount: parseFloat(amount),
      method: "UPI",
      upiId: upiId || "",
      transactionId: transactionId || "",
      paidAt: new Date(),
      ref: `ADV-${Date.now()}`
    });

    const paidTotal = bill.payments.reduce((s, p) => s + (p.amount || 0), 0);
    if (paidTotal >= bill.grandTotal) bill.status = "PAID";
    else if (paidTotal > 0) bill.status = "PARTIALLY_PAID";

    await bill.save();
    res.json({ success: true, bill, paidTotal });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ------------------------------
// COMPLETE PAYMENT
// ------------------------------
router.patch("/:id/complete", async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: "Bill not found" });

    const paidTotal = bill.payments.reduce((s, p) => s + (p.amount || 0), 0);
    if (paidTotal >= bill.grandTotal) bill.status = "PAID";
    else if (paidTotal > 0) bill.status = "PARTIALLY_PAID";
    else bill.status = "APPROVED";

    await bill.save();
    res.json({ success: true, bill });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
