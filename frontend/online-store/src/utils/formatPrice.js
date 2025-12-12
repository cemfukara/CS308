// Maps everything your DB or frontend might send
// (code or symbol) to a locale + symbol.
const CURRENCY_MAP = {
  TRY: { code: 'TRY', symbol: '₺', locale: 'tr-TR' },
  TL: { code: 'TRY', symbol: '₺', locale: 'tr-TR' },
  '₺': { code: 'TRY', symbol: '₺', locale: 'tr-TR' },

  USD: { code: 'USD', symbol: '$', locale: 'en-US' },
  $: { code: 'USD', symbol: '$', locale: 'en-US' },

  EUR: { code: 'EUR', symbol: '€', locale: 'de-DE' },
  '€': { code: 'EUR', symbol: '€', locale: 'de-DE' },
};

// Auto-detect from whatever DB gives you (TRY, TL, ₺, USD, $, EUR, €).
function resolveCurrencyMeta(currencyRaw) {
  if (!currencyRaw) {
    // Default store currency if DB is missing it
    return CURRENCY_MAP.TRY;
  }

  const raw = String(currencyRaw).trim();

  // First try exact symbol (₺, $, €)
  if (CURRENCY_MAP[raw]) return CURRENCY_MAP[raw];

  // Then try uppercased code (try, tl, usd, eur…)
  const upper = raw.toUpperCase();
  if (CURRENCY_MAP[upper]) return CURRENCY_MAP[upper];

  // Unknown 3-letter code → keep code, fallback to en-US formatting
  if (upper.length === 3) {
    return { code: upper, symbol: upper + ' ', locale: 'en-US' };
  }

  // Last fallback: USD
  return CURRENCY_MAP.USD;
}

// Main formatter: returns e.g. ₺1.234,50 or $1,234.50 or €1.234,50
export function formatPrice(value, currencyRaw, isSymbol = true) {
  const amount = Number(value) || 0;
  const meta = resolveCurrencyMeta(currencyRaw);

  const formattedNumber = new Intl.NumberFormat(meta.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  if(!isSymbol){
  return `${meta.code}${formattedNumber}`;  
}

  // Always "symbol + number", no space: ₺1.234,50 / $1,234.50 / €1.234,50
  return `${meta.symbol}${formattedNumber}`;
}
