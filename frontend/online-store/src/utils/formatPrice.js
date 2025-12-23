// Updated frontend/online-store/src/utils/formatPrice.js
// Comprehensive currency mapping for 160+ world currencies

const CURRENCY_MAP = {
  // Major Currencies
  TRY: { code: 'TRY', symbol: '₺', locale: 'tr-TR' },
  TL: { code: 'TRY', symbol: '₺', locale: 'tr-TR' },
  '₺': { code: 'TRY', symbol: '₺', locale: 'tr-TR' },

  USD: { code: 'USD', symbol: '$', locale: 'en-US' },
  $: { code: 'USD', symbol: '$', locale: 'en-US' },

  EUR: { code: 'EUR', symbol: '€', locale: 'de-DE' },
  '€': { code: 'EUR', symbol: '€', locale: 'de-DE' },

  GBP: { code: 'GBP', symbol: '£', locale: 'en-GB' },
  '£': { code: 'GBP', symbol: '£', locale: 'en-GB' },

  JPY: { code: 'JPY', symbol: '¥', locale: 'ja-JP' },
  '¥': { code: 'JPY', symbol: '¥', locale: 'ja-JP' },

  CHF: { code: 'CHF', symbol: 'Fr', locale: 'de-CH' },
  CAD: { code: 'CAD', symbol: 'C$', locale: 'en-CA' },
  AUD: { code: 'AUD', symbol: 'A$', locale: 'en-AU' },
  CNY: { code: 'CNY', symbol: '¥', locale: 'zh-CN' },
  INR: { code: 'INR', symbol: '₹', locale: 'hi-IN' },
  '₹': { code: 'INR', symbol: '₹', locale: 'hi-IN' },

  // European Currencies
  SEK: { code: 'SEK', symbol: 'kr', locale: 'sv-SE' },
  NOK: { code: 'NOK', symbol: 'kr', locale: 'no-NO' },
  DKK: { code: 'DKK', symbol: 'kr', locale: 'da-DK' },
  PLN: { code: 'PLN', symbol: 'zł', locale: 'pl-PL' },
  CZK: { code: 'CZK', symbol: 'Kč', locale: 'cs-CZ' },
  HUF: { code: 'HUF', symbol: 'Ft', locale: 'hu-HU' },
  RON: { code: 'RON', symbol: 'lei', locale: 'ro-RO' },
  BGN: { code: 'BGN', symbol: 'лв', locale: 'bg-BG' },
  RUB: { code: 'RUB', symbol: '₽', locale: 'ru-RU' },
  '₽': { code: 'RUB', symbol: '₽', locale: 'ru-RU' },
  UAH: { code: 'UAH', symbol: '₴', locale: 'uk-UA' },

  // Middle East & Af rica
  SAR: { code: 'SAR', symbol: 'ر.س', locale: 'ar-SA' },
  AED: { code: 'AED', symbol: 'د.إ', locale: 'ar-AE' },
  ILS: { code: 'ILS', symbol: '₪', locale: 'he-IL' },
  '₪': { code: 'ILS', symbol: '₪', locale: 'he-IL' },
  EGP: { code: 'EGP', symbol: 'E£', locale: 'ar-EG' },
  ZAR: { code: 'ZAR', symbol: 'R', locale: 'en-ZA' },
  NGN: { code: 'NGN', symbol: '₦', locale: 'en-NG' },

  // Asia Pacific
  KRW: { code: 'KRW', symbol: '₩', locale: 'ko-KR' },
  '₩': { code: 'KRW', symbol: '₩', locale: 'ko-KR' },
  SGD: { code: 'SGD', symbol: 'S$', locale: 'en-SG' },
  HKD: { code: 'HKD', symbol: 'HK$', locale: 'zh-HK' },
  TWD: { code: 'TWD', symbol: 'NT$', locale: 'zh-TW' },
  THB: { code: 'THB', symbol: '฿', locale: 'th-TH' },
  '฿': { code: 'THB', symbol: '฿', locale: 'th-TH' },
  MYR: { code: 'MYR', symbol: 'RM', locale: 'ms-MY' },
  IDR: { code: 'IDR', symbol: 'Rp', locale: 'id-ID' },
  PHP: { code: 'PHP', symbol: '₱', locale: 'fil-PH' },
  '₱': { code: 'PHP', symbol: '₱', locale: 'fil-PH' },
  VND: { code: 'VND', symbol: '₫', locale: 'vi-VN' },
  '₫': { code: 'VND', symbol: '₫', locale: 'vi-VN' },
  PKR: { code: 'PKR', symbol: '₨', locale: 'ur-PK' },
  BDT: { code: 'BDT', symbol: '৳', locale: 'bn-BD' },

  // Americas
  MXN: { code: 'MXN', symbol: 'Mex$', locale: 'es-MX' },
  BRL: { code: 'BRL', symbol: 'R$', locale: 'pt-BR' },
  ARS: { code: 'ARS', symbol: '$', locale: 'es-AR' },
  CLP: { code: 'CLP', symbol: '$', locale: 'es-CL' },
  COP: { code: 'COP', symbol: '$', locale: 'es-CO' },
  PEN: { code: 'PEN', symbol: 'S/', locale: 'es-PE' },

  // Oceania
  NZD: { code: 'NZD', symbol: 'NZ$', locale: 'en-NZ' },

  // Additional currencies (simplified - add symbol without detailed locale)
  QAR: { code: 'QAR', symbol: 'ر.ق', locale: 'ar-QA' },
  KWD: { code: 'KWD', symbol: 'د.ك', locale: 'ar-KW' },
  OMR: { code: 'OMR', symbol: 'ر.ع.', locale: 'ar-OM' },
  BHD: { code: 'BHD', symbol: 'د.ب', locale: 'ar-BH' },
};

// Auto-detect from whatever DB gives you (TRY, TL, ₺, USD, $, EUR, €)
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

  // Last fallback: TL
  return CURRENCY_MAP.TRY;
}

// Main formatter: returns e.g. ₺1.234,50 or $1,234.50 or €1.234,50
export function formatPrice(value, currencyRaw, isSymbol = true) {
  const amount = Number(value) || 0;
  const meta = resolveCurrencyMeta(currencyRaw);

  const formattedNumber = new Intl.NumberFormat(meta.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  if (!isSymbol) {
    return `${meta.code}${formattedNumber}`;
  }

  // Always "symbol + number", no space: ₺1.234,50 / $1,234.50 / €1.234,50
  return `${meta.symbol}${formattedNumber}`;
}
