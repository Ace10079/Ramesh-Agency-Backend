const express = require("express");
const Measurement = require("../models/Measurement");
const router = express.Router();

// Function to calculate measurement values
function calculateValues(data) {
  const { category, subCategory, style, lengthInches, widthInches, seats, pieces } = data;

  let meters = 0;
  let panels = 0;
  let totalMeters = 0;
  let squareFeet = 0;
  let trackFeet = 0;

  const length = parseFloat(lengthInches) || 0;
  const width = parseFloat(widthInches) || 0;
  const numSeats = parseFloat(seats) || 0;
  const numPieces = parseFloat(pieces) || 0;

  console.log("Calculating values for:", { category, subCategory, style, length, width, numSeats, numPieces });

  // CURTAINS - CURTAINS
  if (category === "Curtains" && subCategory === "Curtains") {
    let lengthAddition = 12;

    if (style === "Pleated") panels = Math.round(width / 20);
    else if (style === "Eyelet") panels = Math.round(width / 24);
    else if (style === "Ripple Fold") panels = Math.round(width / 22);
    else if (style === "Top Fold") {
      lengthAddition = 20;
      panels = Math.round(width / 42);
    }

    meters = (length + lengthAddition) * 0.0254;
    totalMeters = meters * panels;
  }

  // CURTAINS - BLINDS
  else if (category === "Curtains" && subCategory === "Blinds") {
    squareFeet = (length * width) / 144;

    if (style === "Roman") panels = width / 44;
    else if (style === "Roller") meters = (length + 10) * 0.0254, totalMeters = meters;
    else if (style === "Zebra") panels = width / 144;
    else if (style === "PVC") panels = width / 144;
    else if (style === "Industrial Blinds") panels = width / 144;
  }

  // UPHOLSTERY
  else if (category === "Upholstery") {
    if (subCategory === "Sofa") panels = numSeats, totalMeters = numSeats;
    else if (subCategory === "Headboard") squareFeet = (length * width) / 144;
    else if (subCategory === "Puffy") panels = numPieces, totalMeters = numPieces;

    if (subCategory !== "Puffy" && length > 0 && width > 0) {
      meters = (length + 30) * 0.0254;
      const fabricPanels = Math.round(width / 40);
      totalMeters = meters * fabricPanels;
    }
  }

  // Track calculation for curtains
  if (category === "Curtains") trackFeet = width / 12;

  const result = {
    meters: parseFloat(meters.toFixed(2)),
    panels: parseFloat(panels.toFixed(2)),
    totalMeters: parseFloat(totalMeters.toFixed(2)),
    squareFeet: parseFloat(squareFeet.toFixed(2)),
    trackFeet: parseFloat(trackFeet.toFixed(2)),
  };

  console.log("Calculation result:", result);
  return result;
}

// CREATE Measurement
router.post("/create", async (req, res) => {
  try {
    const { orderId, productId, category, subCategory, style, lengthInches, widthInches, seats, pieces } = req.body;

    console.log("Received measurement data:", req.body);

    if (!orderId || !productId || !category || !subCategory)
      return res.status(400).json({ success: false, message: "Missing required fields: orderId, productId, category, subCategory" });

    // For Upholstery Sofa/Puffy, ignore dimensions
    let length = 0, width = 0;
    if (!(category === "Upholstery" && (subCategory === "Sofa" || subCategory === "Puffy"))) {
      if (!lengthInches || !widthInches)
        return res.status(400).json({ success: false, message: "Length and width required for this category" });
      length = parseFloat(lengthInches);
      width = parseFloat(widthInches);
    }

    const calculations = calculateValues({
      category,
      subCategory,
      style: style || "",
      lengthInches: length,
      widthInches: width,
      seats: parseFloat(seats) || 0,
      pieces: parseFloat(pieces) || 0,
    });

    const measurementData = {
      orderId,
      productId,
      category,
      subCategory,
      style: style || "",
      lengthInches: length,
      widthInches: width,
      seats: parseFloat(seats) || 0,
      pieces: parseFloat(pieces) || 0,
      ...calculations,
    };

    const measurement = await Measurement.create(measurementData);

    res.json({ success: true, measurement });
  } catch (err) {
    console.error("Error creating measurement:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET all measurements for an order
router.get("/order/:orderId", async (req, res) => {
  try {
    const list = await Measurement.find({ orderId: req.params.orderId }).populate("productId").sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single measurement
router.get("/:id", async (req, res) => {
  try {
    const measurement = await Measurement.findById(req.params.id).populate("productId");
    if (!measurement) return res.status(404).json({ message: "Measurement not found" });
    res.json(measurement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE measurement
router.patch("/update/:id", async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.body.lengthInches || req.body.widthInches || req.body.category || req.body.subCategory || req.body.style || req.body.seats || req.body.pieces) {
      const current = await Measurement.findById(req.params.id);
      const data = {
        category: req.body.category ?? current.category,
        subCategory: req.body.subCategory ?? current.subCategory,
        style: req.body.style ?? current.style,
        lengthInches: parseFloat(req.body.lengthInches) ?? current.lengthInches,
        widthInches: parseFloat(req.body.widthInches) ?? current.widthInches,
        seats: parseFloat(req.body.seats) ?? current.seats,
        pieces: parseFloat(req.body.pieces) ?? current.pieces,
      };
      Object.assign(updateData, calculateValues(data));
    }

    const updated = await Measurement.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ success: true, measurement: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE measurement
router.delete("/delete/:id", async (req, res) => {
  try {
    await Measurement.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Measurement deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
