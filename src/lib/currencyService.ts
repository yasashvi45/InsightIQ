import countryToCurrency from 'country-to-currency';
import { getCode } from 'country-list';

export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  INR: 86.50,
  EUR: 0.92,
  GBP: 0.79,
  AUD: 1.55,
  CAD: 1.38,
  JPY: 152.00,
  CNY: 7.25,
  SGD: 1.35,
  AED: 3.67,
  CHF: 0.88,
  NZD: 1.68,
  BRL: 5.60,
  ZAR: 18.20,
  MXN: 19.80,
  SAR: 3.75,
  KRW: 1380.0,
  RUB: 95.0,
  SEK: 10.60,
  NOK: 10.80,
  DKK: 6.85,
  PLN: 3.95,
  TRY: 34.0,
  IDR: 15800.0,
  MYR: 4.40,
  THB: 34.50,
  VND: 25400.0,
  PHP: 58.0,
  HKD: 7.78,
  TWD: 32.50
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  INR: '₹',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  CNY: '¥',
  SGD: 'S$',
  AED: 'AED ',
  CHF: 'CHF ',
  NZD: 'NZ$',
  BRL: 'R$',
  ZAR: 'R ',
  MXN: 'Mex$',
  SAR: 'SAR ',
  KRW: '₩',
  RUB: '₽',
  SEK: 'kr ',
  NOK: 'kr ',
  DKK: 'kr ',
  PLN: 'zł ',
  TRY: '₺',
  IDR: 'Rp ',
  MYR: 'RM ',
  THB: '฿',
  VND: '₫',
  PHP: '₱',
  HKD: 'HK$',
  TWD: 'NT$'
};

const COUNTRY_ALIASES: Record<string, string> = {
  india: 'INR',
  in: 'INR',
  ind: 'INR',
  bharat: 'INR',
  usa: 'USD',
  us: 'USD',
  'united states': 'USD',
  'united states of america': 'USD',
  america: 'USD',
  uk: 'GBP',
  gb: 'GBP',
  gbr: 'GBP',
  'united kingdom': 'GBP',
  'great britain': 'GBP',
  england: 'GBP',
  scotland: 'GBP',
  wales: 'GBP',
  germany: 'EUR',
  deutschland: 'EUR',
  de: 'EUR',
  france: 'EUR',
  fr: 'EUR',
  italy: 'EUR',
  italia: 'EUR',
  it: 'EUR',
  spain: 'EUR',
  espana: 'EUR',
  es: 'EUR',
  netherlands: 'EUR',
  holland: 'EUR',
  nl: 'EUR',
  belgium: 'EUR',
  austria: 'EUR',
  ireland: 'EUR',
  portugal: 'EUR',
  finland: 'EUR',
  greece: 'EUR',
  eurozone: 'EUR',
  europe: 'EUR',
  eu: 'EUR',
  australia: 'AUD',
  au: 'AUD',
  aus: 'AUD',
  canada: 'CAD',
  ca: 'CAD',
  can: 'CAD',
  japan: 'JPY',
  jp: 'JPY',
  jpn: 'JPY',
  nippon: 'JPY',
  china: 'CNY',
  cn: 'CNY',
  chn: 'CNY',
  singapore: 'SGD',
  sg: 'SGD',
  sgp: 'SGD',
  uae: 'AED',
  'united arab emirates': 'AED',
  dubai: 'AED',
  'abu dhabi': 'AED',
  ae: 'AED',
  switzerland: 'CHF',
  ch: 'CHF',
  che: 'CHF',
  'new zealand': 'NZD',
  nz: 'NZD',
  nzl: 'NZD',
  brazil: 'BRL',
  br: 'BRL',
  bra: 'BRL',
  'south africa': 'ZAR',
  za: 'ZAR',
  zaf: 'ZAR',
  mexico: 'MXN',
  mx: 'MXN',
  mex: 'MXN',
  'saudi arabia': 'SAR',
  sa: 'SAR',
  sau: 'SAR',
  ksa: 'SAR',
  'south korea': 'KRW',
  korea: 'KRW',
  kr: 'KRW',
  kor: 'KRW',
  russia: 'RUB',
  ru: 'RUB',
  rus: 'RUB',
  sweden: 'SEK',
  se: 'SEK',
  norway: 'NOK',
  no: 'NOK',
  denmark: 'DKK',
  dk: 'DKK',
  poland: 'PLN',
  pl: 'PLN',
  turkey: 'TRY',
  tr: 'TRY',
  indonesia: 'IDR',
  id: 'IDR',
  malaysia: 'MYR',
  my: 'MYR',
  thailand: 'THB',
  th: 'THB',
  vietnam: 'VND',
  vn: 'VND',
  philippines: 'PHP',
  ph: 'PHP',
  'hong kong': 'HKD',
  hk: 'HKD',
  taiwan: 'TWD',
  tw: 'TWD'
};

export function resolveCountryToCurrency(countryNameOrCode: string | null | undefined): string | null {
  if (!countryNameOrCode) return null;
  const raw = String(countryNameOrCode).trim().toLowerCase();
  if (!raw) return null;

  // Direct custom alias check
  if (COUNTRY_ALIASES[raw]) {
    return COUNTRY_ALIASES[raw];
  }

  // Normalized clean alias check
  const clean = raw.replace(/[^a-z0-9]/g, '');
  for (const [key, currency] of Object.entries(COUNTRY_ALIASES)) {
    if (key.replace(/[^a-z0-9]/g, '') === clean) {
      return currency;
    }
  }

  // Check country-list & country-to-currency
  try {
    const code = getCode(raw) || getCode(countryNameOrCode);
    if (code) {
      const curr = (countryToCurrency as Record<string, string>)[code.toUpperCase()];
      if (curr) return curr;
    }
  } catch {
    // Ignore error
  }

  // If input itself is already a 3-letter currency code (e.g. INR, USD, EUR)
  if (raw.length === 3 && EXCHANGE_RATES[raw.toUpperCase()]) {
    return raw.toUpperCase();
  }

  return null;
}

export function detectCurrencyFromSymbolOrValue(value: any): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value);

  if (str.includes('₹') || str.toLowerCase().includes('inr')) return 'INR';
  if (str.includes('€') || str.toLowerCase().includes('eur')) return 'EUR';
  if (str.includes('£') || str.toLowerCase().includes('gbp')) return 'GBP';
  if (str.includes('¥') || str.toLowerCase().includes('jpy')) return 'JPY';
  if (str.toLowerCase().includes('a$') || str.toLowerCase().includes('aud')) return 'AUD';
  if (str.toLowerCase().includes('c$') || str.toLowerCase().includes('cad')) return 'CAD';
  if (str.includes('$') || str.toLowerCase().includes('usd')) return 'USD';
  if (str.includes('₩') || str.toLowerCase().includes('krw')) return 'KRW';
  if (str.includes('₽') || str.toLowerCase().includes('rub')) return 'RUB';
  if (str.toLowerCase().includes('aed')) return 'AED';
  if (str.toLowerCase().includes('chf')) return 'CHF';
  if (str.toLowerCase().includes('sgd')) return 'SGD';

  return null;
}

export function parseMonetaryValue(val: any): { value: number; detectedCurrency: string | null } {
  if (val === null || val === undefined || val === '') {
    return { value: NaN, detectedCurrency: null };
  }
  if (typeof val === 'number') {
    return { value: isNaN(val) ? NaN : val, detectedCurrency: null };
  }

  const str = String(val).trim();
  const detectedCurrency = detectCurrencyFromSymbolOrValue(str);

  let cleanStr = str.replace(/[₹$€£¥₩₽A-Za-z\s"']/g, '');

  if (cleanStr.includes(',') && cleanStr.includes('.')) {
    if (cleanStr.lastIndexOf(',') < cleanStr.lastIndexOf('.')) {
      cleanStr = cleanStr.replace(/,/g, '');
    } else {
      cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
    }
  } else if (cleanStr.includes(',')) {
    const commaParts = cleanStr.split(',');
    if (commaParts.length > 2 || (commaParts.length === 2 && commaParts[1].length === 3)) {
      cleanStr = cleanStr.replace(/,/g, '');
    } else if (commaParts.length === 2 && commaParts[1].length <= 2) {
      cleanStr = cleanStr.replace(',', '.');
    } else {
      cleanStr = cleanStr.replace(/,/g, '');
    }
  }

  cleanStr = cleanStr.replace(/[^0-9.-]/g, '');
  if (cleanStr === '' || cleanStr === '-' || cleanStr === '.') {
    return { value: NaN, detectedCurrency };
  }

  const num = parseFloat(cleanStr);
  return { value: isNaN(num) ? NaN : num, detectedCurrency };
}

export function parseNumeric(val: any): number {
  const res = parseMonetaryValue(val);
  return isNaN(res.value) ? 0 : res.value;
}

export function convertCurrency(
  amount: number,
  sourceCurrency: string | null | undefined,
  targetCurrency: string | null | undefined
): number {
  if (isNaN(amount) || amount === 0) return 0;
  if (!sourceCurrency || !targetCurrency) return amount;

  const src = sourceCurrency.toUpperCase().trim();
  const tgt = targetCurrency.toUpperCase().trim();

  if (src === tgt) return amount;

  const srcRate = EXCHANGE_RATES[src];
  const tgtRate = EXCHANGE_RATES[tgt];

  if (!srcRate || !tgtRate) {
    // If rate is unknown, return amount as-is
    return amount;
  }

  // Convert: Amount in USD = amount / srcRate; Amount in Target = inUSD * tgtRate
  const amountInUSD = amount / srcRate;
  const converted = amountInUSD * tgtRate;
  return converted;
}

export function resolveUserCurrency(user: { currency?: string; country?: string; locale?: string } | null | undefined): {
  currency: string;
  locale: string;
  symbol: string;
} {
  let targetCurrency = 'USD';

  if (user?.currency && EXCHANGE_RATES[user.currency.toUpperCase()]) {
    targetCurrency = user.currency.toUpperCase();
  } else if (user?.country) {
    const resolvedFromCountry = resolveCountryToCurrency(user.country);
    if (resolvedFromCountry && EXCHANGE_RATES[resolvedFromCountry]) {
      targetCurrency = resolvedFromCountry;
    }
  } else if (user?.locale?.includes('IN')) {
    targetCurrency = 'INR';
  }

  let locale = user?.locale || (targetCurrency === 'INR' ? 'en-IN' : targetCurrency === 'EUR' ? 'de-DE' : targetCurrency === 'GBP' ? 'en-GB' : 'en-US');
  const symbol = CURRENCY_SYMBOLS[targetCurrency] || `${targetCurrency} `;

  return { currency: targetCurrency, locale, symbol };
}

export function formatCurrencyValue(
  value: number | string | undefined | null,
  currencyCode: string = 'USD',
  localeOverride?: string,
  minFractionDigits: number = 2
): string {
  if (value === undefined || value === null) return '';
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, '')) : value;
  if (isNaN(num) || !isFinite(num)) return '';

  const curr = (currencyCode || 'USD').toUpperCase();
  const locale = localeOverride || (curr === 'INR' ? 'en-US' : curr === 'EUR' ? 'de-DE' : curr === 'GBP' ? 'en-GB' : 'en-US');

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: minFractionDigits,
      maximumFractionDigits: 2
    }).format(num);
  } catch {
    const sym = CURRENCY_SYMBOLS[curr] || `${curr} `;
    return `${sym}${num.toLocaleString(locale, { minimumFractionDigits: minFractionDigits, maximumFractionDigits: 2 })}`;
  }
}

export function formatCompactCurrencyValue(
  value: number | string | undefined | null,
  currencyCode: string = 'USD'
): string {
  if (value === undefined || value === null || value === '') return '';
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, '')) : value;
  if (isNaN(num) || !isFinite(num)) return '';

  const curr = (currencyCode || 'USD').toUpperCase();
  const sym = CURRENCY_SYMBOLS[curr] || `${curr} `;
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const prefix = isNegative ? '-' : '';

  if (absNum === 0) {
    return `${sym}0`;
  }

  if (curr === 'INR') {
    if (absNum >= 10000000) {
      const cr = absNum / 10000000;
      const formatted = cr >= 10 || cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(1);
      return `${prefix}${sym}${formatted}Cr`;
    }
    if (absNum >= 100000) {
      const l = absNum / 100000;
      const formatted = l >= 10 || l % 1 === 0 ? l.toFixed(0) : l.toFixed(1);
      return `${prefix}${sym}${formatted}L`;
    }
    if (absNum >= 1000) {
      const k = absNum / 1000;
      const formatted = k >= 10 || k % 1 === 0 ? k.toFixed(0) : k.toFixed(1);
      return `${prefix}${sym}${formatted}K`;
    }
    return `${prefix}${sym}${Math.round(absNum).toLocaleString('en-IN')}`;
  }

  // USD / EUR / GBP / AUD / CAD / JPY / Others
  if (absNum >= 1000000000) {
    const b = absNum / 1000000000;
    const formatted = b >= 10 || b % 1 === 0 ? b.toFixed(0) : b.toFixed(1);
    return `${prefix}${sym}${formatted}B`;
  }
  if (absNum >= 1000000) {
    const m = absNum / 1000000;
    const formatted = m >= 10 || m % 1 === 0 ? m.toFixed(0) : m.toFixed(1);
    return `${prefix}${sym}${formatted}M`;
  }
  if (absNum >= 1000) {
    const k = absNum / 1000;
    const formatted = k >= 10 || k % 1 === 0 ? k.toFixed(0) : k.toFixed(1);
    return `${prefix}${sym}${formatted}K`;
  }
  return `${prefix}${sym}${Math.round(absNum).toLocaleString()}`;
}
