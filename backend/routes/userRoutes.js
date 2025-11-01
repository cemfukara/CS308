// Defines user-related API routes (/register, /login, /profile, etc.).
import express from "express";
const router = express.Router();

// define routes
router.get("/", (req, res) => {
    res.send("User route works!");
});

export default router;
