// Formatting Utilities and Constants

export const formatCurrency = (amount, overrideCurrency) => {
  const num = Number(amount) || 0;
  const currencyCode = overrideCurrency || localStorage.getItem('spendwise_currency') || 'USD';
  
  const currencyMap = {
    USD: { locale: 'en-US', currency: 'USD' },
    INR: { locale: 'en-IN', currency: 'INR' },
    EUR: { locale: 'de-DE', currency: 'EUR' },
    GBP: { locale: 'en-GB', currency: 'GBP' },
  };

  const config = currencyMap[currencyCode] || currencyMap.USD;

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatDate = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investments',
  'Business',
  'Gift',
  'Other Income',
];

export const EXPENSE_CATEGORIES = [
  'Housing',
  'Food & Dining',
  'Transportation',
  'Utilities',
  'Shopping',
  'Entertainment',
  'Healthcare',
  'Education',
  'Travel',
  'Personal Care',
  'Other Expense',
];

export const ALL_CATEGORIES = [
  ...INCOME_CATEGORIES,
  ...EXPENSE_CATEGORIES,
];
