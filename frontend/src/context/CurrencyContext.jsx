// Currency Context
// Provides multi-currency switching (USD, INR, EUR, GBP) and formats values throughout the application.

import { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export const CURRENCIES = {
  USD: { code: 'USD', symbol: '$', rate: 1.0, label: 'USD ($)', locale: 'en-US' },
  INR: { code: 'INR', symbol: '₹', rate: 84.0, label: 'INR (₹)', locale: 'en-IN' },
  EUR: { code: 'EUR', symbol: '€', rate: 0.92, label: 'EUR (€)', locale: 'de-DE' },
  GBP: { code: 'GBP', symbol: '£', rate: 0.78, label: 'GBP (£)', locale: 'en-GB' },
};

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(() => {
    return localStorage.getItem('spendwise_currency') || 'USD';
  });

  const activeCurrency = CURRENCIES[currency] || CURRENCIES.USD;

  const setCurrency = (code) => {
    if (CURRENCIES[code]) {
      setCurrencyState(code);
      localStorage.setItem('spendwise_currency', code);
    }
  };

  // Convert and format any USD base amount to current selected currency
  const formatAmount = (baseUsdAmount, shouldConvert = false) => {
    const num = Number(baseUsdAmount) || 0;
    const finalAmount = shouldConvert ? num * activeCurrency.rate : num;

    return new Intl.NumberFormat(activeCurrency.locale, {
      style: 'currency',
      currency: activeCurrency.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(finalAmount);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencySymbol: activeCurrency.symbol,
        activeCurrency,
        setCurrency,
        formatAmount,
        availableCurrencies: Object.values(CURRENCIES),
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
