require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./src/route/authRoute");
const adminRoutes = require("./src/route/adminRoute");
const productRoutes = require("./src/route/productRoute");
const categoryRoutes = require("./src/route/categoryRoute");
const cartRoutes = require("./src/route/cartRoute");
const wishlistRoutes = require("./src/route/wishlistRoute");
const orderRoutes = require("./src/route/orderRoute");
const reviewRoutes = require("./src/route/reviewRoute");

const app = express();

app.use(cors());
app.use(express.json());

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);