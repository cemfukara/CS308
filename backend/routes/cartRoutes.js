// Defines shopping cart routes (/api/cart/add, /api/cart/remove).

import express from "express";

const router = express.Router();

// define routes
router.get("/", (req, res) => {
    res.send("Cart route works!");
});

export default router;
