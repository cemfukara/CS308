// backend/models/Currency.js

import { db } from '../app/config/db.js';

/**
 * Get all active currencies
 */
export async function getAllCurrencies() {
  const [rows] = await db.query(
    `
      SELECT 
        currency_id,
        code,
        symbol,
        name,
        exchange_rate,
        last_updated,
        is_active
      FROM currencies
      WHERE is_active = TRUE
      ORDER BY code ASC
    `
  );
  return rows;
}

/**
 * Get a specific currency by code
 */
export async function getCurrencyByCode(code) {
  const [rows] = await db.query(
    `
      SELECT 
        currency_id,
        code,
        symbol,
        name,
        exchange_rate,
        last_updated,
        is_active
      FROM currencies
      WHERE code = ? AND is_active = TRUE
    `,
    [code]
  );
  return rows[0] || null;
}

/**
 * Get all exchange rates (returns object with code as key)
 */
export async function getAllExchangeRates() {
  const [rows] = await db.query(
    `
      SELECT code, exchange_rate, last_updated
      FROM currencies
      WHERE is_active = TRUE
    `
  );

  // Convert to object for easy lookup
  const rates = {};
  for (const row of rows) {
    rates[row.code] = {
      rate: parseFloat(row.exchange_rate),
      lastUpdated: row.last_updated,
    };
  }
  return rates;
}

/**
 * Update exchange rate for a specific currency
 */
export async function updateExchangeRate(code, rate) {
  const [result] = await db.query(
    `
      UPDATE currencies
      SET exchange_rate = ?,
          last_updated = NOW()
      WHERE code = ?
    `,
    [rate, code]
  );
  return result.affectedRows > 0;
}

/**
 * Bulk update exchange rates
 * @param {Object} rates - Object with currency codes as keys and rates as values
 * Example: { 'USD': 0.032, 'EUR': 0.029, 'GBP': 0.025 }
 */
export async function bulkUpdateExchangeRates(rates) {
  if (!rates || Object.keys(rates).length === 0) {
    return 0;
  }

  // Build a case statement for bulk update
  const codes = Object.keys(rates);
  const caseStatement = codes
    .map((code) => `WHEN code = '${code}' THEN ${rates[code]}`)
    .join(' ');

  const [result] = await db.query(
    `
      UPDATE currencies
      SET exchange_rate = CASE ${caseStatement} END,
          last_updated = NOW()
      WHERE code IN (${codes.map(() => '?').join(',')})
    `,
    codes
  );

  return result.affectedRows;
}

/**
 * Get currencies that need refresh (older than 24 hours)
 */
export async function getCurrenciesNeedingRefresh() {
  const [rows] = await db.query(
    `
      SELECT code, exchange_rate, last_updated
      FROM currencies
      WHERE is_active = TRUE
        AND (last_updated IS NULL OR last_updated < DATE_SUB(NOW(), INTERVAL 24 HOUR))
    `
  );
  return rows;
}

/**
 * Create a new currency (for admin use)
 */
export async function createCurrency({ code, symbol, name, exchangeRate = 1.0 }) {
  const [result] = await db.query(
    `
      INSERT INTO currencies (code, symbol, name, exchange_rate)
      VALUES (?, ?, ?, ?)
    `,
    [code, symbol, name, exchangeRate]
  );
  return result.insertId;
}

/**
 * Deactivate a currency (soft delete)
 */
export async function deactivateCurrency(code) {
  const [result] = await db.query(
    `
      UPDATE currencies
      SET is_active = FALSE
      WHERE code = ?
    `,
    [code]
  );
  return result.affectedRows > 0;
}

/**
 * Get currency statistics (for admin dashboard)
 */
export async function getCurrencyStats() {
  const [rows] = await db.query(
    `
      SELECT 
        COUNT(*) as total_currencies,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_currencies,
        MIN(last_updated) as oldest_update,
        MAX(last_updated) as newest_update
      FROM currencies
    `
  );
  return rows[0];
}
