const express = require('express');
const router = express.Router();
const controller = require('../controllers/discountController');

// POST /api/discount
router.post('/', controller.applyDiscount);

module.exports = router;
