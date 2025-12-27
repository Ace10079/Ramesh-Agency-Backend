const express = require("express");
const router = express.Router();

const MeasurementBill = require("../models/MeasurementBill");
const Measurement = require("../models/Measurement");
const Customer = require("../models/Customer");
const genToken = require("../utils/genToken");

/**
 * CREATE MEASUREMENT BILL
 */
router.post("/create", async (req, res) => {
    try {
      const { orderId, customerId, measurementIds } = req.body;
  
      const customer = await Customer.findById(customerId);
      if (!customer) return res.status(404).json({ message: "Customer not found" });
  
      // ✅ Check if a bill already exists for this order (not rejected)
      const existingBill = await MeasurementBill.findOne({ orderId, status: { $ne: "REJECTED" } });
      if (existingBill) {
        return res.json({ success: true, bill: existingBill, message: "Existing bill found" });
      }
  
      const measurements = await Measurement.find({ _id: { $in: measurementIds } })
        .populate("productId");
  
      if (!measurements.length)
        return res.status(400).json({ message: "No measurements found" });
  
      let grandTotal = 0;
  
      const items = measurements.map(m => {
        const qty = m.totalMeters || m.squareFeet || 1;
        const price = m.productId?.price || 0;
        const total = qty * price;
        grandTotal += total;
  
        return {
          measurementId: m._id,
          productName: m.productId?.name,
          category: m.category,
          subCategory: m.subCategory,
          totalMeters: m.totalMeters,
          squareFeet: m.squareFeet,
          unitPrice: price,
          total
        };
      });
  
      const bill = await MeasurementBill.create({
        orderId,
        customerId,
        customerSnapshot: {
          name: customer.name,
          mobile: customer.mobile,
          address: customer.address
        },
        items,
        grandTotal,
        billLinkToken: genToken(12)
      });
  
      // 🔒 Lock measurements
      await Measurement.updateMany(
        { _id: { $in: measurementIds } },
        { measurementBillId: bill._id }
      );
  
      res.json({ success: true, bill });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  });
  

/**
 * ADMIN VIEW
 */
router.get("/:id", async (req, res) => {
  const bill = await MeasurementBill.findById(req.params.id);
  if (!bill) return res.status(404).json({ message: "Not found" });
  res.json(bill);
});

/**
 * CUSTOMER VIEW (TOKEN)
 */
router.get("/token/:token", async (req, res) => {
  const bill = await MeasurementBill.findOne({ billLinkToken: req.params.token });
  if (!bill) return res.status(404).json({ message: "Not found" });
  res.json(bill);
});

/**
 * APPROVE
 */
router.patch("/:id/approve", async (req, res) => {
  const bill = await MeasurementBill.findByIdAndUpdate(
    req.params.id,
    { status: "APPROVED" },
    { new: true }
  );
  res.json(bill);
});

/**
 * REJECT
 */
router.patch("/:id/reject", async (req, res) => {
  const bill = await MeasurementBill.findByIdAndUpdate(
    req.params.id,
    { status: "REJECTED", rejectionReason: req.body.reason },
    { new: true }
  );
  res.json(bill);
});

module.exports = router;
