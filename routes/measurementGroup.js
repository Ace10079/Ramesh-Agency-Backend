const express = require("express");
const MeasurementGroup = require("../models/MeasurementGroup");

const router = express.Router();

/**
 * CREATE NEXT MEASUREMENT GROUP (1,2,3...)
 */
router.post("/create", async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: "orderId is required" });
    }

    const lastGroup = await MeasurementGroup
      .findOne({ orderId })
      .sort({ groupNumber: -1 });

    const nextNumber = lastGroup ? lastGroup.groupNumber + 1 : 1;

    const group = await MeasurementGroup.create({
      orderId,
      groupNumber: nextNumber,
    });

    res.json({ success: true, group });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET GROUPS BY ORDER
 */
router.get("/order/:orderId", async (req, res) => {
  try {
    const groups = await MeasurementGroup
      .find({ orderId: req.params.orderId })
      .sort({ groupNumber: 1 });

    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
