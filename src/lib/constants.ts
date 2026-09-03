import { getNames, getCode } from 'country-list';
import ct from 'countries-and-timezones';
import countryToCurrency from 'country-to-currency';

export const COUNTRIES = getNames().map(name => {
  const code = getCode(name) || '';
  const country = ct.getCountry(code);
  const timezones = country?.timezones || ['UTC'];
  const timezone = timezones[0] || 'UTC';
  const currency = countryToCurrency[code as keyof typeof countryToCurrency] || 'USD';
  
  // Create some default formats based on country
  let dateFormat = 'DD/MM/YYYY';
  let numberFormat = '1,234.56';
  if (code === 'US') {
    dateFormat = 'MM/DD/YYYY';
  } else if (code === 'CN' || code === 'JP') {
    dateFormat = 'YYYY/MM/DD';
  }

  if (['DE', 'FR', 'IT', 'ES'].includes(code)) {
    numberFormat = '1.234,56';
  }

  return {
    code,
    name,
    timezone,
    currency,
    currencySymbol: currency, // We can just use the code as symbol fallback
    dateFormat,
    numberFormat,
    language: 'English', // Default fallback
    locale: `en-${code}`
  };
}).sort((a, b) => a.name.localeCompare(b.name));

export const TIMEZONES = Object.keys(ct.getAllTimezones()).sort();

const uniqueCurrencies = Array.from(new Set(Object.values(countryToCurrency)));
export const CURRENCIES = uniqueCurrencies.map(code => ({ code, symbol: code })).sort((a, b) => a.code.localeCompare(b.code));

export const LANGUAGES = [
  'English (US)',
  'English (UK)',
  'English (India)',
  'English (Australia)',
  'English (Canada)',
  'English (Singapore)',
  'Hindi',
  'Telugu',
  'Tamil',
  'Kannada',
  'Malayalam',
  'French',
  'German',
  'Japanese',
  'Chinese',
  'Spanish',
  'Arabic'
].sort();

export const DATE_FORMATS = [
  'DD/MM/YYYY',
  'MM/DD/YYYY',
  'YYYY-MM-DD',
  'DD-MM-YYYY'
];

export const NUMBER_FORMATS = [
  '1,234.56',
  '1.234,56',
  '1,23,456.78',
  '1 234,56'
];

export const INDUSTRIES = [
  'Technology',
  'Software',
  'Healthcare',
  'Education',
  'Finance',
  'Retail',
  'Manufacturing',
  'Construction',
  'Real Estate',
  'Marketing',
  'Agriculture',
  'Hospitality',
  'Government',
  'Logistics',
  'Automotive',
  'Telecommunications',
  'Energy',
  'Media',
  'Consulting',
  'Legal',
  'Non-profit'
].sort();

export const COMPANY_SIZES = [
  '1',
  '2–10',
  '11–50',
  '51–200',
  '201–500',
  '501–1000',
  '1000+'
];

export const ROLES = [
  'Founder',
  'CEO',
  'CTO',
  'COO',
  'Owner',
  'Manager',
  'Developer',
  'Engineer',
  'Analyst',
  'Student',
  'Freelancer',
  'Consultant',
  'Marketing',
  'Sales',
  'HR',
  'Operations',
  'IT Administrator'
].sort();
