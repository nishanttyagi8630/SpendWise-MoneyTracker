// SpendWise API Client Service
// Handles all communication with the backend REST API

const API_BASE = '/api';

// Helper function to send requests with authentication
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('spendwise_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

// Authentication APIs
export const authApi = {
  register: (name, email, password) => 
    request('/auth/register', { method: 'POST', body: { name, email, password } }),

  login: (email, password) => 
    request('/auth/login', { method: 'POST', body: { email, password } }),

  getMe: () => 
    request('/auth/me', { method: 'GET' }),
};

// Transactions APIs
export const transactionApi = {
  getAll: (filters = {}) => {
    const query = new URLSearchParams();
    if (filters.type && filters.type !== 'all') query.append('type', filters.type);
    if (filters.category && filters.category !== 'all') query.append('category', filters.category);
    if (filters.search) query.append('search', filters.search);
    if (filters.startDate) query.append('startDate', filters.startDate);
    if (filters.endDate) query.append('endDate', filters.endDate);
    
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/transactions${queryString}`, { method: 'GET' });
  },

  getById: (id) => 
    request(`/transactions/${id}`, { method: 'GET' }),

  create: (transactionData) => 
    request('/transactions', { method: 'POST', body: transactionData }),

  update: (id, transactionData) => 
    request(`/transactions/${id}`, { method: 'PUT', body: transactionData }),

  delete: (id) => 
    request(`/transactions/${id}`, { method: 'DELETE' }),
};

// Budget Management APIs
export const budgetApi = {
  getAll: (month, year) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request(`/budgets${queryString}`, { method: 'GET' });
  },

  createOrUpdate: (budgetData) => 
    request('/budgets', { method: 'POST', body: budgetData }),

  update: (id, budgetData) => 
    request(`/budgets/${id}`, { method: 'PUT', body: budgetData }),

  delete: (id) => 
    request(`/budgets/${id}`, { method: 'DELETE' }),
};

// Savings Goals APIs
export const goalApi = {
  getAll: () => 
    request('/goals', { method: 'GET' }),

  create: (goalData) => 
    request('/goals', { method: 'POST', body: goalData }),

  update: (id, goalData) => 
    request(`/goals/${id}`, { method: 'PUT', body: goalData }),

  contribute: (id, amount) => 
    request(`/goals/${id}/contribute`, { method: 'POST', body: { amount } }),

  delete: (id) => 
    request(`/goals/${id}`, { method: 'DELETE' }),
};

// Analytics & Dashboard APIs
export const analyticsApi = {
  getSummary: () => 
    request('/analytics/summary', { method: 'GET' }),

  getMonthly: () => 
    request('/analytics/monthly', { method: 'GET' }),

  getCategories: () => 
    request('/analytics/categories', { method: 'GET' }),

  getRecent: () => 
    request('/analytics/recent', { method: 'GET' }),

  getFinancialHealth: () => 
    request('/analytics/financial-health', { method: 'GET' }),
};

// Subscriptions & Recurring Bills APIs
export const subscriptionApi = {
  getAll: () => 
    request('/subscriptions', { method: 'GET' }),

  create: (subData) => 
    request('/subscriptions', { method: 'POST', body: subData }),

  update: (id, subData) => 
    request(`/subscriptions/${id}`, { method: 'PUT', body: subData }),

  toggleStatus: (id, status) => 
    request(`/subscriptions/${id}/status`, { method: 'PATCH', body: { status } }),

  delete: (id) => 
    request(`/subscriptions/${id}`, { method: 'DELETE' }),
};

// Split Bills & Shared Expenses APIs
export const splitBillApi = {
  getAll: () => 
    request('/splits', { method: 'GET' }),

  create: (billData) => 
    request('/splits', { method: 'POST', body: billData }),

  settleParticipant: (id, participantIndex, isPaid) => 
    request(`/splits/${id}/settle-participant`, { method: 'PATCH', body: { participantIndex, isPaid } }),

  delete: (id) => 
    request(`/splits/${id}`, { method: 'DELETE' }),
};

// Data Import & Export APIs
export const dataApi = {
  exportCSV: async () => {
    const token = localStorage.getItem('spendwise_token');
    const response = await fetch('/api/data/export/csv', {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (!response.ok) throw new Error('Failed to download CSV export');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spendwise_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  },

  importCSV: (records) => 
    request('/data/import/csv', { method: 'POST', body: { records } }),
};

// AI Assistant API
export const aiApi = {
  chat: (message, history = []) => 
    request('/ai/chat', { method: 'POST', body: { message, history } }),
};
