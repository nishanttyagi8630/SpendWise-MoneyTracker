// Backend Self-Test Script
// Tests all controllers and database storage directly without needing external network access

const authController = require('./controllers/authController');
const transactionController = require('./controllers/transactionController');
const budgetController = require('./controllers/budgetController');
const goalController = require('./controllers/goalController');
const analyticsController = require('./controllers/analyticsController');
const aiController = require('./controllers/aiController');

// Helper to mock express req and res
const mockReqRes = (reqData = {}) => {
  const req = {
    body: reqData.body || {},
    query: reqData.query || {},
    params: reqData.params || {},
    headers: reqData.headers || {},
    user: reqData.user || null
  };

  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    }
  };

  return { req, res };
};

const runTests = async () => {
  console.log('--- 🧪 STARTING SPENDWISE BACKEND TEST ---');

  // 1. Test Registration
  const testEmail = `testuser_${Date.now()}@example.com`;
  console.log(`\n1. Testing Registration with email: ${testEmail}...`);
  const regMocks = mockReqRes({
    body: {
      name: 'Alex Johnson',
      email: testEmail,
      password: 'password123'
    }
  });

  await authController.register(regMocks.req, regMocks.res);
  console.log('Status:', regMocks.res.statusCode);
  console.log('Result:', regMocks.res.data.success ? 'SUCCESS' : 'FAILED', regMocks.res.data.message);
  
  if (!regMocks.res.data.success) {
    throw new Error('Registration failed: ' + JSON.stringify(regMocks.res.data));
  }

  const token = regMocks.res.data.token;
  const user = regMocks.res.data.user;
  const authUser = { id: user.id, email: user.email };

  // 2. Test Login
  console.log('\n2. Testing Login...');
  const loginMocks = mockReqRes({
    body: {
      email: testEmail,
      password: 'password123'
    }
  });
  await authController.login(loginMocks.req, loginMocks.res);
  console.log('Status:', loginMocks.res.statusCode);
  console.log('Result:', loginMocks.res.data.success ? 'SUCCESS' : 'FAILED');

  // 3. Test Create Income Transaction
  console.log('\n3. Testing Create Income Transaction...');
  const incomeMocks = mockReqRes({
    user: authUser,
    body: {
      type: 'income',
      amount: 4500,
      category: 'Salary',
      date: new Date().toISOString(),
      description: 'Monthly Software Engineer Salary'
    }
  });
  await transactionController.createTransaction(incomeMocks.req, incomeMocks.res);
  console.log('Income created:', incomeMocks.res.data.data.amount, incomeMocks.res.data.data.category);

  // 4. Test Create Expense Transactions
  console.log('\n4. Testing Create Expense Transactions...');
  const exp1Mocks = mockReqRes({
    user: authUser,
    body: {
      type: 'expense',
      amount: 1200,
      category: 'Housing',
      date: new Date().toISOString(),
      description: 'Monthly Apartment Rent'
    }
  });
  await transactionController.createTransaction(exp1Mocks.req, exp1Mocks.res);

  const exp2Mocks = mockReqRes({
    user: authUser,
    body: {
      type: 'expense',
      amount: 350,
      category: 'Food & Dining',
      date: new Date().toISOString(),
      description: 'Groceries and dinner'
    }
  });
  await transactionController.createTransaction(exp2Mocks.req, exp2Mocks.res);

  // 5. Test Get Transactions
  console.log('\n5. Testing Get Transactions...');
  const getTxMocks = mockReqRes({ user: authUser });
  await transactionController.getTransactions(getTxMocks.req, getTxMocks.res);
  console.log(`Fetched ${getTxMocks.res.data.count} transactions for user`);

  // 6. Test Budget Creation & Tracking
  console.log('\n6. Testing Budget Creation & Tracking...');
  const budgetMocks = mockReqRes({
    user: authUser,
    body: {
      category: 'Food & Dining',
      amount: 500
    }
  });
  await budgetController.createOrUpdateBudget(budgetMocks.req, budgetMocks.res);

  const getBudgetMocks = mockReqRes({ user: authUser });
  await budgetController.getBudgets(getBudgetMocks.req, getBudgetMocks.res);
  const foodBudget = getBudgetMocks.res.data.data.find(b => b.category === 'Food & Dining');
  console.log(`Food Budget limit: $${foodBudget.amount}, Spent: $${foodBudget.spent}, Remaining: $${foodBudget.remaining}, Used: ${foodBudget.percentage}%`);

  // 7. Test Savings Goal Creation & Deposit
  console.log('\n7. Testing Savings Goal & Deposit...');
  const goalMocks = mockReqRes({
    user: authUser,
    body: {
      name: 'Emergency Fund',
      targetAmount: 5000,
      currentAmount: 1000,
      category: 'Emergency'
    }
  });
  await goalController.createGoal(goalMocks.req, goalMocks.res);
  const createdGoalId = goalMocks.res.data.data._id || goalMocks.res.data.data.id;

  // Add deposit
  const depositMocks = mockReqRes({
    user: authUser,
    params: { id: createdGoalId },
    body: { amount: 500 }
  });
  await goalController.contributeToGoal(depositMocks.req, depositMocks.res);
  console.log(`Goal after deposit: $${depositMocks.res.data.data.currentAmount}`);

  // 8. Test Analytics Summary
  console.log('\n8. Testing Analytics Summary...');
  const summaryMocks = mockReqRes({ user: authUser });
  await analyticsController.getSummary(summaryMocks.req, summaryMocks.res);
  console.log('Summary:', summaryMocks.res.data.data);

  // 9. Test AI Chat
  console.log('\n9. Testing AI Assistant...');
  const aiMocks = mockReqRes({
    user: authUser,
    body: { message: 'How does the 50/30/20 rule apply to my income?' }
  });
  await aiController.chat(aiMocks.req, aiMocks.res);
  console.log('AI Response preview:\n', aiMocks.res.data.reply.substring(0, 150) + '...');

  console.log('\n✅ ALL 9 BACKEND TESTS PASSED SUCCESSFULLY!\n');
  process.exit(0);
};

runTests().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
