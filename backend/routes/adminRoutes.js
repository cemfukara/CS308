// Defines manager/admin-specific routes (discounts, analytics, etc.).
// app/routes/adminRoutes.js

import express from "express";

const router = express.Router();

// define routes
router.get("/", (req, res) => {
    res.send("Admin route works!");
});

export default router;
