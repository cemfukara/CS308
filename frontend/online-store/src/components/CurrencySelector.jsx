// frontend/online-store/src/components/CurrencySelector.jsx

import { useState, useEffect, useRef } from 'react';
import useCurrencyStore from '../store/currencyStore.js';
import './CurrencySelector.css';

function CurrencySelector() {
  const {
    selectedCurrency,
    currencies,
    setSelectedCurrency,
    fetchCurrencies,
    fetchExchangeRates,
  } = useCurrencyStore();

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Fetch currencies and rates on mount
  useEffect(() => {
    if (currencies.length === 0) {
      fetchCurrencies();
    }
    fetchExchangeRates();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCurrencyChange = (currencyCode) => {
    setSelectedCurrency(currencyCode);
    setIsOpen(false);
    setSearchTerm('');
  };

  const selectedCurrencyInfo = currencies.find((c) => c.code === selectedCurrency);

  // Filter currencies based on search
  const filteredCurrencies = currencies.filter(
    (currency) =>
      currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currency.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group currencies by region for better UX
  const popularCurrencies = ['TRY', 'USD', 'EUR', 'GBP', 'JPY', 'CNY'];
  const popular = filteredCurrencies.filter((c) => popularCurrencies.includes(c.code));
  const others = filteredCurrencies.filter((c) => !popularCurrencies.includes(c.code));

  return (
    <div className="currency-selector" ref={dropdownRef}>
      <button
        className="currency-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select currency"
      >
        <span className="currency-symbol">{selectedCurrencyInfo?.symbol || '₺'}</span>
        <span className="currency-code">{selectedCurrency}</span>
        <svg
          className={`dropdown-arrow ${isOpen ? 'open' : ''}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2.5 4.5L6 8L9.5 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="currency-dropdown">
          <div className="currency-search">
            <input
              type="text"
              placeholder="Search currencies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          <div className="currency-list">
            {popular.length > 0 && (
              <>
                <div className="currency-group-label">Popular</div>
                {popular.map((currency) => (
                  <button
                    key={currency.code}
                    className={`currency-item ${selectedCurrency === currency.code ? 'selected' : ''}`}
                    onClick={() => handleCurrencyChange(currency.code)}
                  >
                    <span className="currency-item-symbol">{currency.symbol}</span>
                    <div className="currency-item-info">
                      <span className="currency-item-code">{currency.code}</span>
                      <span className="currency-item-name">{currency.name}</span>
                    </div>
                    {selectedCurrency === currency.code && (
                      <svg
                        className="currency-item-check"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M13.5 4.5L6 12L2.5 8.5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </>
            )}

            {others.length > 0 && popular.length > 0 && (
              <div className="currency-divider"></div>
            )}

            {others.length > 0 && (
              <>
                {popular.length > 0 && <div className="currency-group-label">All Currencies</div>}
                {others.map((currency) => (
                  <button
                    key={currency.code}
                    className={`currency-item ${selectedCurrency === currency.code ? 'selected' : ''}`}
                    onClick={() => handleCurrencyChange(currency.code)}
                  >
                    <span className="currency-item-symbol">{currency.symbol}</span>
                    <div className="currency-item-info">
                      <span className="currency-item-code">{currency.code}</span>
                      <span className="currency-item-name">{currency.name}</span>
                    </div>
                    {selectedCurrency === currency.code && (
                      <svg
                        className="currency-item-check"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M13.5 4.5L6 12L2.5 8.5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </>
            )}

            {filteredCurrencies.length === 0 && (
              <div className="currency-empty">No currencies found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CurrencySelector;
