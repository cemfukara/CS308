// backend/utils/currencyService.js

import * as Currency from '../models/Currency.js';

// Exchange rate API configuration
const EXCHANGE_API_URL = 'https://v6.exchangerate-api.com/v6';
const EXCHANGE_API_KEY = process.env.EXCHANGE_API_KEY || 'YOUR_API_KEY_HERE'; // Add to .env
const BASE_CURRENCY = 'TRY'; // Turkish Lira is our base

/**
 * Fetch latest exchange rates from API
 * @returns {Promise<Object>} Object with currency codes as keys and rates as values
 */
export async function fetchExchangeRatesFromAPI() {
  try {
    const response = await fetch(
      `${EXCHANGE_API_URL}/${EXCHANGE_API_KEY}/latest/${BASE_CURRENCY}`
    );

    if (!response.ok) {
      throw new Error(`Exchange API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.result !== 'success') {
      throw new Error(`Exchange API returned error: ${data['error-type']}`);
    }

    // API returns rates where 1 TRY = X foreign currency
    return data.conversion_rates;
  } catch (error) {
    console.error('Failed to fetch exchange rates from API:', error);
    throw error;
  }
}

/**
 * Update all currency exchange rates from external API
 * @returns {Promise<number>} Number of currencies updated
 */
export async function refreshAllExchangeRates() {
  try {
    // Fetch latest rates from API
    const apiRates = await fetchExchangeRatesFromAPI();

    // Filter to only include currencies we have in our database
    const currencies = await Currency.getAllCurrencies();
    const currencyCodes = currencies.map((c) => c.code);

    const ratesToUpdate = {};
    for (const code of currencyCodes) {
      if (apiRates[code]) {
        ratesToUpdate[code] = apiRates[code];
      }
    }

    // Bulk update in database
    const updatedCount = await Currency.bulkUpdateExchangeRates(ratesToUpdate);

    console.log(`Updated ${updatedCount} exchange rates from API`);
    return updatedCount;
  } catch (error) {
    console.error('Failed to refresh exchange rates:', error);
    // Return 0 to indicate failure, but don't throw - we'll use cached rates
    return 0;
  }
}

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {Promise<number>} Converted amount
 */
export async function convertCurrency(amount, fromCurrency, toCurrency) {
  // If same currency, no conversion needed
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Get exchange rates
  const rates = await Currency.getAllExchangeRates();

  const fromRate = rates[fromCurrency]?.rate;
  const toRate = rates[toCurrency]?.rate;

  if (!fromRate || !toRate) {
    throw new Error(`Exchange rate not found for ${fromCurrency} or ${toCurrency}`);
  }

  // Convert: amount in fromCurrency -> TRY -> toCurrency
  // Example: $100 USD -> TRY -> EUR
  // If 1 TRY = 0.03 USD, then $100 = 100/0.03 = 3333.33 TRY
  // If 1 TRY = 0.028 EUR, then 3333.33 TRY = 3333.33 * 0.028 = 93.33 EUR
  const amountInTRY = amount / fromRate;
  const convertedAmount = amountInTRY * toRate;

  return parseFloat(convertedAmount.toFixed(2));
}

/**
 * Get exchange rate between two currencies
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {Promise<number>} Exchange rate
 */
export async function getExchangeRate(fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) {
    return 1.0;
  }

  const rates = await Currency.getAllExchangeRates();

  const fromRate = rates[fromCurrency]?.rate;
  const toRate = rates[toCurrency]?.rate;

  if (!fromRate || !toRate) {
    throw new Error(`Exchange rate not found for ${fromCurrency} or ${toCurrency}`);
  }

  // Calculate cross rate
  // If 1 TRY = 0.03 USD and 1 TRY = 0.028 EUR
  // Then 1 USD = (1/0.03) TRY = 33.33 TRY
  // And 33.33 TRY = 33.33 * 0.028 EUR = 0.933 EUR
  // So 1 USD = 0.933 EUR, rate = toRate / fromRate
  return toRate / fromRate;
}

/**
 * Check if exchange rates need refresh (older than 24 hours)
 * @returns {Promise<boolean>} True if refresh is needed
 */
export async function needsRefresh() {
  const currenciesNeedingRefresh = await Currency.getCurrenciesNeedingRefresh();
  return currenciesNeedingRefresh.length > 0;
}

/**
 * Auto-refresh exchange rates if needed (background task)
 * Call this periodically (e.g., on server start, or via cron job)
 */
export async function autoRefreshIfNeeded() {
  try {
    const shouldRefresh = await needsRefresh();

    if (shouldRefresh) {
      console.log('Exchange rates are stale, refreshing...');
      const updated = await refreshAllExchangeRates();
      console.log(`Auto-refresh completed: ${updated} rates updated`);
      return updated;
    } else {
      console.log('Exchange rates are up to date, no refresh needed');
      return 0;
    }
  } catch (error) {
    console.error('Auto-refresh failed:', error);
    return 0;
  }
}

/**
 * Format price with currency symbol and locale-specific formatting
 * @param {number} amount - Amount to format
 * @param {string} currencyCode - Currency code
 * @returns {Promise<string>} Formatted price string
 */
export async function formatPrice(amount, currencyCode) {
  const currency = await Currency.getCurrencyByCode(currencyCode);

  if (!currency) {
    // Fallback formatting
    return `${currencyCode} ${amount.toFixed(2)}`;
  }

  // Get locale for currency (simplified mapping)
  const localeMap = {
    TRY: 'tr-TR',
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    JPY: 'ja-JP',
    // Add more as needed
  };

  const locale = localeMap[currencyCode] || 'en-US';

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Convert product prices to target currency
 * @param {Array} products - Array of product objects with price field
 * @param {string} targetCurrency - Target currency code
 * @returns {Promise<Array>} Products with converted prices (original prices preserved)
 */
export async function convertProductPrices(products, targetCurrency) {
  if (!products || products.length === 0) {
    return products;
  }

  const convertedProducts = [];

  for (const product of products) {
    const sourceCurrency = product.currency || 'TL';

    // Convert price and list_price if they exist
    const convertedProduct = { ...product };

    if (product.price) {
      convertedProduct.price = await convertCurrency(
        product.price,
        sourceCurrency,
        targetCurrency
      );
    }

    if (product.list_price) {
      convertedProduct.list_price = await convertCurrency(
        product.list_price,
        sourceCurrency,
        targetCurrency
      );
    }

    // Store the currency code used for display
    convertedProduct.display_currency = targetCurrency;
    convertedProduct.original_currency = sourceCurrency;

    convertedProducts.push(convertedProduct);
  }

  return convertedProducts;
}
