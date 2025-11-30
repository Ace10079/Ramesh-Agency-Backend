const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// ❌ Removed uploads static folder
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// routes
app.use("/product", require("./routes/productRoutes"));
app.use("/customer", require("./routes/customerRoutes"));
app.use("/order", require("./routes/orderRoutes"));
app.use("/bill", require("./routes/billRoutes"));
app.use("/measurement", require("./routes/measurementRoutes"));

app.get("/", (req, res) => res.send("Backend Running..."));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
