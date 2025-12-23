// frontend/online-store/src/lib/currenciesApi.js

import { api } from './api.js';

const BASE_URL = '/currencies';

/**
 * Get all active currencies
 */
export async function getAllCurrencies() {
  const response = await api.get(BASE_URL);
  return response;
}

/**
 * Get all exchange rates
 */
export async function getExchangeRates() {
  const response = await api.get(`${BASE_URL}/rates`);
  return response;
}

/**
 * Get a specific currency by code
 */
export async function getCurrencyByCode(code) {
  const response = await api.get(`${BASE_URL}/${code}`);
  return response;
}

/**
 * Convert amount from one currency to another
 */
export async function convertCurrency(amount, from, to) {
  const response = await api.post(`${BASE_URL}/convert`, {
    amount,
    from,
    to,
  });
  return response;
}

/**
 * Manually refresh exchange rates (admin only)
 */
export async function refreshExchangeRates() {
  const response = await api.post(`${BASE_URL}/refresh`);
  return response;
}
