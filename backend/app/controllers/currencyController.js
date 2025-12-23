// backend/app/controllers/currencyController.js

import * as Currency from '../../models/Currency.js';
import * as CurrencyService from '../../utils/currencyService.js';

/**
 * GET /api/currencies
 * Get all active currencies
 */
export async function getAllCurrenciesController(req, res) {
  try {
    const currencies = await Currency.getAllCurrencies();

    res.status(200).json({
      success: true,
      data: currencies,
      count: currencies.length,
    });
  } catch (error) {
    console.error('Error fetching currencies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch currencies',
    });
  }
}

/**
 * GET /api/currencies/rates
 * Get all exchange rates
 */
export async function getExchangeRatesController(req, res) {
  try {
    const rates = await Currency.getAllExchangeRates();

    res.status(200).json({
      success: true,
      data: rates,
      base: 'TRY',
    });
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exchange rates',
    });
  }
}

/**
 * GET /api/currencies/:code
 * Get a specific currency by code
 */
export async function getCurrencyByCodeController(req, res) {
  try {
    const { code } = req.params;
    const currency = await Currency.getCurrencyByCode(code.toUpperCase());

    if (!currency) {
      return res.status(404).json({
        success: false,
        message: `Currency ${code} not found`,
      });
    }

    res.status(200).json({
      success: true,
      data: currency,
    });
  } catch (error) {
    console.error('Error fetching currency:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch currency',
    });
  }
}

/**
 * POST /api/currencies/convert
 * Convert amount from one currency to another
 * Body: { amount, from, to }
 */
export async function convertCurrencyController(req, res) {
  try {
    const { amount, from, to } = req.body;

    // Validation
    if (!amount || !from || !to) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: amount, from, to',
      });
    }

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number',
      });
    }

    const convertedAmount = await CurrencyService.convertCurrency(
      parseFloat(amount),
      from.toUpperCase(),
      to.toUpperCase()
    );

    const exchangeRate = await CurrencyService.getExchangeRate(
      from.toUpperCase(),
      to.toUpperCase()
    );

    res.status(200).json({
      success: true,
      data: {
        original: {
          amount: parseFloat(amount),
          currency: from.toUpperCase(),
        },
        converted: {
          amount: convertedAmount,
          currency: to.toUpperCase(),
        },
        exchangeRate: exchangeRate,
      },
    });
  } catch (error) {
    console.error('Error converting currency:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to convert currency',
    });
  }
}

/**
 * POST /api/currencies/refresh
 * Manually refresh exchange rates (admin only)
 */
export async function refreshExchangeRatesController(req, res) {
  try {
    const updatedCount = await CurrencyService.refreshAllExchangeRates();

    res.status(200).json({
      success: true,
      message: 'Exchange rates refreshed successfully',
      updatedCount: updatedCount,
    });
  } catch (error) {
    console.error('Error refreshing exchange rates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh exchange rates',
    });
  }
}

/**
 * GET /api/currencies/stats
 * Get currency statistics (admin only)
 */
export async function getCurrencyStatsController(req, res) {
  try {
    const stats = await Currency.getCurrencyStats();
    const needsRefresh = await CurrencyService.needsRefresh();

    res.status(200).json({
      success: true,
      data: {
        ...stats,
        needsRefresh: needsRefresh,
      },
    });
  } catch (error) {
    console.error('Error fetching currency stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch currency statistics',
    });
  }
}
