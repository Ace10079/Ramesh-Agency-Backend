const express = require("express");
const Measurement = require("../models/Measurement");

const router = express.Router();

/* ---------- CALCULATIONS ---------- */
function calculateValues(data) {
  const { category, subCategory, style, lengthInches, widthInches, seats, pieces } = data;

  let meters = 0,
    panels = 0,
    totalMeters = 0,
    squareFeet = 0,
    trackFeet = 0;

  const length = parseFloat(lengthInches) || 0;
  const width = parseFloat(widthInches) || 0;
  const numSeats = parseFloat(seats) || 0;
  const numPieces = parseFloat(pieces) || 0;

  if (category === "Curtains" && subCategory === "Curtains") {
    let lengthAdd = 12;
    if (style === "Pleated") panels = Math.round(width / 20);
    else if (style === "Eyelet") panels = Math.round(width / 24);
    else if (style === "Ripple Fold") panels = Math.round(width / 22);
    else if (style === "Top Fold") {
      lengthAdd = 20;
      panels = Math.round(width / 42);
    }
    meters = (length + lengthAdd) * 0.0254;
    totalMeters = meters * panels;
  }

  else if (category === "Curtains" && subCategory === "Blinds") {
    squareFeet = (length * width) / 144;
    if (style === "Roman") panels = width / 44;
    else if (style === "Roller") {
      meters = (length + 10) * 0.0254;
      totalMeters = meters;
    }
  }

  else if (category === "Upholstery") {
    if (subCategory === "Sofa") {
      panels = numSeats;
      totalMeters = numSeats;
    } else if (subCategory === "Puffy") {
      panels = numPieces;
      totalMeters = numPieces;
    } else if (subCategory === "Headboard") {
      squareFeet = (length * width) / 144;
      meters = (length + 30) * 0.0254;
      const fabricPanels = Math.round(width / 40);
      totalMeters = meters * fabricPanels;
    }
  }

  if (category === "Curtains") trackFeet = width / 12;

  return {
    meters: +meters.toFixed(2),
    panels: +panels.toFixed(2),
    totalMeters: +totalMeters.toFixed(2),
    squareFeet: +squareFeet.toFixed(2),
    trackFeet: +trackFeet.toFixed(2),
  };
}

/* ---------- CREATE MEASUREMENT ---------- */
router.post("/create", async (req, res) => {
  try {
    const {
      orderId,
      groupId,
      productId,
      category,
      subCategory,
      style,
      lengthInches,
      widthInches,
      seats,
      pieces,
    } = req.body;

    if (!orderId || !groupId || !productId || !category || !subCategory) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const calculations = calculateValues({
      category,
      subCategory,
      style,
      lengthInches,
      widthInches,
      seats,
      pieces,
    });

    const measurement = await Measurement.create({
      orderId,
      groupId,
      productId,
      category,
      subCategory,
      style: style || "Standard",
      lengthInches: lengthInches || 0,
      widthInches: widthInches || 0,
      seats: seats || 0,
      pieces: pieces || 0,
      ...calculations,
    });

    res.json({ success: true, measurement });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ---------- GET BY GROUP ---------- */
router.get("/group/:groupId", async (req, res) => {
  const list = await Measurement
    .find({ groupId: req.params.groupId })
    .populate("productId")
    .sort({ createdAt: -1 });

  res.json(list);
});

/* ---------- DELETE ---------- */
router.delete("/delete/:id", async (req, res) => {
  await Measurement.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});
// Get all measurements for an order
// GET measurements by order
router.get("/order/:orderId", async (req, res) => {
  try {
    const measurements = await Measurement.find({ orderId: req.params.orderId })
      .populate("productId")
      .sort({ createdAt: -1 });
    res.json(measurements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



module.exports = router;
