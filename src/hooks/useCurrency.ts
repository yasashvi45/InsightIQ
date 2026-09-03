import { useAuth } from '../context/AuthContext';
import { useCallback, useMemo } from 'react';
import {
  resolveUserCurrency,
  formatCurrencyValue,
  formatCompactCurrencyValue,
  convertCurrency as convertCurrencyUtil,
  resolveCountryToCurrency,
  detectCurrencyFromSymbolOrValue,
  parseMonetaryValue,
  EXCHANGE_RATES,
  CURRENCY_SYMBOLS
} from '../lib/currencyService';

export function useCurrency() {
  const { user } = useAuth();
  
  const { currency, locale, symbol } = useMemo(() => {
    return resolveUserCurrency(user);
  }, [user?.currency, user?.country, user?.locale]);

  const formatCurrency = useCallback((value: number | string | undefined | null, overrideCurrency?: string, overrideLocale?: string) => {
    return formatCurrencyValue(value, overrideCurrency || currency, overrideLocale || locale);
  }, [currency, locale]);

  const formatCompactCurrency = useCallback((value: number | string | undefined | null, overrideCurrency?: string) => {
    return formatCompactCurrencyValue(value, overrideCurrency || currency);
  }, [currency]);

  const convert = useCallback((amount: number, sourceCurrency: string | null | undefined, targetCurrencyOverride?: string) => {
    return convertCurrencyUtil(amount, sourceCurrency, targetCurrencyOverride || currency);
  }, [currency]);

  return {
    currency,
    currencySymbol: symbol,
    locale,
    formatCurrency,
    formatCompactCurrency,
    convertCurrency: convert,
    resolveCountryToCurrency,
    detectCurrencyFromSymbolOrValue,
    parseMonetaryValue,
    EXCHANGE_RATES,
    CURRENCY_SYMBOLS
  };
}
