// frontend/online-store/src/store/currencyStore.js

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAllCurrencies, getExchangeRates } from '../lib/currenciesApi.js';

const useCurrencyStore = create(
  persist(
    (set, get) => ({
      // State
      selectedCurrency: 'TL',
      currencies: [],
      exchangeRates: {},
      lastUpdated: null,
      loading: false,
      error: null,

      // Actions

      /**
       * Set the selected currency
       */
      setSelectedCurrency: (currency) => {
        set({ selectedCurrency: currency });
      },

      /**
       * Fetch all available currencies
       */
      fetchCurrencies: async () => {
        try {
          set({ loading: true, error: null });
          const response = await getAllCurrencies();

          if (response.success) {
            set({
              currencies: response.data,
              loading: false,
            });
          } else {
            throw new Error('Failed to fetch currencies');
          }
        } catch (error) {
          console.error('Error fetching currencies:', error);
          set({
            error: error.message || 'Failed to fetch currencies',
            loading: false,
          });
        }
      },

      /**
       * Fetch exchange rates
       */
      fetchExchangeRates: async () => {
        try {
          set({ loading: true, error: null });
          const response = await getExchangeRates();

          if (response.success) {
            // Backend returns an object with currency codes as keys
            // Format: { 'USD': { rate: 0.03, lastUpdated: ... }, 'EUR': { rate: 0.028, ... } }

            set({
              exchangeRates: response.data,
              lastUpdated: new Date().toISOString(),
              loading: false,
            });
          } else {
            throw new Error('Failed to fetch exchange rates');
          }
        } catch (error) {
          console.error('Error fetching exchange rates:', error);
          set({
            error: error.message || 'Failed to fetch exchange rates',
            loading: false,
          });
        }
      },

      /**
       * Normalize currency codes (handle aliases like TL -> TRY)
       */
      normalizeCurrencyCode: (code) => {
        // Map common aliases to standard ISO codes
        const aliases = {
          'TL': 'TRY',  // Turkish Lira
          'TR': 'TRY',
        };
        return aliases[code?.toUpperCase()] || code?.toUpperCase();
      },

      /**
       * Convert amount from one currency to another
       * @param {number} amount - Amount to convert
       * @param {string} fromCurrency - Source currency code
       * @param {string} toCurrency - Target currency code (defaults to selected currency)
       * @returns {number} Converted amount
       */
      convertAmount: (amount, fromCurrency, toCurrency = null) => {
        const targetCurrency = toCurrency || get().selectedCurrency;
        const rates = get().exchangeRates;

        // Normalize currency codes
        const normalizedFrom = get().normalizeCurrencyCode(fromCurrency);
        const normalizedTo = get().normalizeCurrencyCode(targetCurrency);

        // If same currency, no conversion needed
        if (normalizedFrom === normalizedTo) {
          return amount;
        }

        const fromRate = rates[normalizedFrom]?.rate;
        const toRate = rates[normalizedTo]?.rate;

        if (!fromRate || !toRate) {
          console.warn(`Exchange rate not found for ${normalizedFrom} or ${normalizedTo}`);
          return amount;
        }

        // Convert: amount in fromCurrency -> TRY -> toCurrency
        const amountInTRY = amount / fromRate;
        const convertedAmount = amountInTRY * toRate;

        return parseFloat(convertedAmount.toFixed(2));
      },

      /**
       * Get exchange rate between two currencies
       * @param {string} fromCurrency - Source currency code
       * @param {string} toCurrency - Target currency code
       * @returns {number} Exchange rate
       */
      getExchangeRate: (fromCurrency, toCurrency = null) => {
        const targetCurrency = toCurrency || get().selectedCurrency;

        // Normalize currency codes
        const normalizedFrom = get().normalizeCurrencyCode(fromCurrency);
        const normalizedTo = get().normalizeCurrencyCode(targetCurrency);

        if (normalizedFrom === normalizedTo) {
          return 1.0;
        }

        const rates = get().exchangeRates;
        const fromRate = rates[normalizedFrom]?.rate;
        const toRate = rates[normalizedTo]?.rate;

        if (!fromRate || !toRate) {
          return 1.0;
        }

        return toRate / fromRate;
      },

      /**
       * Get currency info by code
       * @param {string} code - Currency code
       * @returns {Object} Currency object
       */
      getCurrencyInfo: (code) => {
        const currencies = get().currencies;
        return currencies.find((c) => c.code === code);
      },

      /**
       * Initialize currency store (fetch currencies and rates)
       */
      initialize: async () => {
        await get().fetchCurrencies();
        await get().fetchExchangeRates();
      },
    }),
    {
      name: 'currency-storage', // localStorage key
      partialize: (state) => ({
        selectedCurrency: state.selectedCurrency,
        // Don't persist currencies and rates - fetch fresh on load
      }),
    }
  )
);

export default useCurrencyStore;
