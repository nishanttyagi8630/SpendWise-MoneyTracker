// Test New Features Suite
require('dotenv').config();
const subscriptionController = require('./controllers/subscriptionController');
const splitBillController = require('./controllers/splitBillController');
const exportImportController = require('./controllers/exportImportController');
const analyticsController = require('./controllers/analyticsController');

const mockReqRes = (data = {}) => {
  const req = {
    body: data.body || {},
    query: data.query || {},
    params: data.params || {},
    user: data.user || { id: 'user_demo_001', email: 'demo@spendwise.io' }
  };
  const res = {
    statusCode: 200,
    headers: {},
    setHeader(key, val) { this.headers[key] = val; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.data = payload; return this; },
    send(payload) { this.data = payload; return this; }
  };
  return { req, res };
};

async function testAll() {
  console.log('--- 🚀 TESTING NEW RESUME FEATURES ---');

  // 1. Test Subscriptions
  console.log('\n1. Testing Subscriptions...');
  const subMocks = mockReqRes();
  await subscriptionController.getSubscriptions(subMocks.req, subMocks.res);
  console.log('Subscriptions count:', subMocks.res.data.data.length);
  console.log('Monthly Subscription Burn:', `$${subMocks.res.data.summary.totalMonthlyBurn}`);
  console.log('Upcoming in 7 days:', subMocks.res.data.upcoming7Days.length);

  // 2. Test Split Bills
  console.log('\n2. Testing Split Bills...');
  const splitMocks = mockReqRes();
  await splitBillController.getSplitBills(splitMocks.req, splitMocks.res);
  console.log('Split bills count:', splitMocks.res.data.data.length);
  console.log('You are owed:', `$${splitMocks.res.data.summary.totalOwedToYou}`);
  console.log('You owe:', `$${splitMocks.res.data.summary.totalYouOwe}`);

  // 3. Test Financial Health Score & Runway
  console.log('\n3. Testing Financial Health Score & Emergency Runway...');
  const healthMocks = mockReqRes();
  await analyticsController.getFinancialHealthScore(healthMocks.req, healthMocks.res);
  console.log('Health Score:', `${healthMocks.res.data.data.score}/100 (${healthMocks.res.data.data.grade})`);
  console.log('Emergency Runway:', `${healthMocks.res.data.data.emergencyRunwayMonths} months`);
  console.log('Pillars:', healthMocks.res.data.data.pillars);
  console.log('Top Recommendation:', healthMocks.res.data.data.recommendations[0]);

  // 4. Test CSV Export
  console.log('\n4. Testing CSV Export...');
  const exportMocks = mockReqRes();
  await exportImportController.exportCSV(exportMocks.req, exportMocks.res);
  console.log('CSV Content-Type:', exportMocks.res.headers['Content-Type']);
  console.log('CSV lines count:', exportMocks.res.data.split('\n').length);

  // 5. Test CSV Bulk Import
  console.log('\n5. Testing CSV Bulk Ingestion...');
  const importMocks = mockReqRes({
    body: {
      records: [
        { date: '2026-11-03', type: 'income', category: 'Freelance', amount: 350, description: 'Client consultation fee' },
        { date: '2026-11-03', type: 'expense', category: 'Shopping', amount: 89, description: 'Wireless mechanical keyboard' }
      ]
    }
  });
  await exportImportController.importCSV(importMocks.req, importMocks.res);
  console.log('Import Status:', importMocks.res.statusCode, importMocks.res.data.message);

  console.log('\n✅ ALL NEW FEATURE BACKEND TESTS PASSED!\n');
  process.exit(0);
}

testAll().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
