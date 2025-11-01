// Defines product-related routes (/api/products, /api/products/:id).
import express from "express";
import { fetchProducts } from "../app/controllers/productController.js";

const router = express.Router();

// GET /api/products
router.get("/", fetchProducts);

export default router;
