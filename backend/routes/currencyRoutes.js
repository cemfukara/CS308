// backend/routes/currencyRoutes.js

import express from 'express';
import {
  getAllCurrenciesController,
  getExchangeRatesController,
  getCurrencyByCodeController,
  convertCurrencyController,
  refreshExchangeRatesController,
  getCurrencyStatsController,
} from '../app/controllers/currencyController.js';
import { authenticate, authorizeRoles } from '../app/middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/currencies
 * @desc    Get all active currencies
 * @access  Public
 */
router.get('/', getAllCurrenciesController);

/**
 * @route   GET /api/currencies/rates
 * @desc    Get all exchange rates
 * @access  Public
 */
router.get('/rates', getExchangeRatesController);

/**
 * @route   GET /api/currencies/stats
 * @desc    Get currency statistics
 * @access  Admin only
 */
router.get(
  '/stats',
  authenticate,
  authorizeRoles(['sales manager', 'product manager']),
  getCurrencyStatsController
);

/**
 * @route   GET /api/currencies/:code
 * @desc    Get a specific currency by code
 * @access  Public
 */
router.get('/:code', getCurrencyByCodeController);

/**
 * @route   POST /api/currencies/convert
 * @desc    Convert amount from one currency to another
 * @access  Public
 */
router.post('/convert', convertCurrencyController);

/**
 * @route   POST /api/currencies/refresh
 * @desc    Manually refresh exchange rates from API
 * @access  Admin only
 */
router.post(
  '/refresh',
  authenticate,
  authorizeRoles(['sales manager', 'product manager']),
  refreshExchangeRatesController
);

export default router;
