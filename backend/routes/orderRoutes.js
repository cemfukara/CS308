// Defines routes for order handling (/api/orders, /api/orders/:id).
// app/routes/orderRoutes.js

import express from "express";

const router = express.Router();

// define routes
router.get("/", (req, res) => {
    res.send("Order route works!");
});

export default router;
