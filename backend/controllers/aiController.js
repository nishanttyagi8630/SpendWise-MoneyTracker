// AI Assistant Controller
// Securely handles financial questions using OpenAI API if configured,
// and provides a built-in smart financial rule engine if the API key is absent.

const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');

// Helper to gather user's financial summary context for AI
const getUserFinancialContext = async (userId) => {
  try {
    const transactions = await Transaction.find({ userId });
    const budgets = await Budget.find({ userId });
    const goals = await Goal.find({ userId });

    let totalIncome = 0;
    let totalExpense = 0;
    const categorySpending = {};

    transactions.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') totalIncome += amt;
      if (t.type === 'expense') {
        totalExpense += amt;
        const cat = t.category || 'General';
        categorySpending[cat] = (categorySpending[cat] || 0) + amt;
      }
    });

    const topCategories = Object.entries(categorySpending)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, amt]) => `${cat}: $${amt.toFixed(2)}`);

    return {
      totalIncome: totalIncome.toFixed(2),
      totalExpense: totalExpense.toFixed(2),
      balance: (totalIncome - totalExpense).toFixed(2),
      topCategories: topCategories.length > 0 ? topCategories.join(', ') : 'None yet',
      budgetsCount: budgets.length,
      goalsCount: goals.length,
      goalsList: goals.map(g => `${g.name} ($${g.currentAmount}/$${g.targetAmount})`).join(', ') || 'No active goals'
    };
  } catch (err) {
    return null;
  }
};

// Built-in intelligent rule engine when OpenAI API key is unavailable
const generateRuleBasedReply = (message, context) => {
  const q = message.toLowerCase();

  // If question is about 50/30/20 rule
  if (q.includes('50/30/20') || q.includes('rule') || q.includes('split')) {
    const income = Number(context.totalIncome) || 0;
    const needs = (income * 0.5).toFixed(2);
    const wants = (income * 0.3).toFixed(2);
    const savings = (income * 0.2).toFixed(2);

    return `The **50/30/20 Budgeting Rule** is a proven way to organize your money:
- **50% for Needs:** Housing, groceries, utilities, and essentials${income > 0 ? ` (Your target: **$${needs}**)` : ''}.
- **30% for Wants:** Dining out, entertainment, shopping, and hobbies${income > 0 ? ` (Your target: **$${wants}**)` : ''}.
- **20% for Savings & Debt:** Emergency fund, retirement, and investments${income > 0 ? ` (Your target: **$${savings}**)` : ''}.

💡 *Tip:* Check your Category Breakdown in the Analytics tab to see how your current spending aligns with these benchmarks!`;
  }

  // If question is about saving money or reducing expenses
  if (q.includes('save') || q.includes('cut') || q.includes('reduce') || q.includes('spend less')) {
    return `Here are high-impact ways to optimize your finances:
1. **Target your top spending category:** Your biggest expenses right now are: **${context.topCategories}**. Trimming just 10% here will have the fastest impact.
2. **Review Recurring Subscriptions:** Audit streaming services, gym memberships, and monthly software.
3. **Set Monthly Category Budgets:** Head to the **Budgets** section and assign strict limits for non-essential categories.
4. **Implement the 48-Hour Rule:** Wait 48 hours before non-essential purchases over $50 to prevent impulse spending.

Your current net balance is **$${context.balance}**. Consistent small habits add up quickly!`;
  }

  // If question is about emergency fund or goals
  if (q.includes('emergency') || q.includes('goal') || q.includes('target')) {
    return `### Building a Solid Savings Safety Net:
1. **Target Size:** Aim to save 3 to 6 months of living expenses in a high-yield savings account.
2. **Current Goals:** You currently have **${context.goalsCount}** active goals: ${context.goalsList}.
3. **Automate Contributions:** Pay yourself first on payday by transferring funds towards your goal before spending.
4. **Milestone Strategy:** Break large targets into smaller $500 or $1,000 milestones so you stay motivated!`;
  }

  // If question is about current financial health / overview
  if (q.includes('how am i doing') || q.includes('summary') || q.includes('analyze') || q.includes('status')) {
    const balanceNum = Number(context.balance);
    const healthStatus = balanceNum >= 0 ? "healthy and positive" : "in a deficit (expenses exceed income)";
    
    return `### Your SpendWise Financial Snapshot:
- **Total Income Recorded:** $${context.totalIncome}
- **Total Expenses Recorded:** $${context.totalExpense}
- **Net Cash Flow:** $${context.balance}
- **Top Expense Categories:** ${context.topCategories}
- **Status:** Your overall cash flow is **${healthStatus}**.

${balanceNum < 0 ? '⚠️ *Action Item:* Consider pausing non-essential purchases until income catches up with expenses.' : '🎉 *Great job!* Keep allocating your surplus cash into your Savings Goals.'}`;
  }

  // Default financial advisor response
  return `Hello! I am your **SpendWise Financial Assistant**.

Here are some things I can help you with:
- **"Analyze my spending"** to review your current cash flow.
- **"How does the 50/30/20 rule apply to me?"** to calculate your personalized budget breakdown.
- **"How can I cut expenses?"** for actionable saving strategies.
- **"How to set up an emergency fund?"** for safety net tips.

Feel free to ask any question about budgeting, saving, or managing your money!`;
};

// @desc    Chat with AI Assistant
// @route   POST /api/ai/chat
exports.chat = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a message.'
      });
    }

    const userId = req.user.id;
    const context = await getUserFinancialContext(userId);

    const apiKey = process.env.OPENAI_API_KEY;

    // If OpenAI API key is provided, try calling the OpenAI API
    if (apiKey && apiKey.trim() !== '' && apiKey !== 'your_openai_api_key_here') {
      try {
        const systemPrompt = `You are SpendWise AI, a supportive, practical, and highly skilled personal finance assistant.
You help users budget wisely, avoid debt, and build savings.
The user's current verified financial data is:
- Total Income: $${context.totalIncome}
- Total Expenses: $${context.totalExpense}
- Current Balance: $${context.balance}
- Top Expense Categories: ${context.topCategories}
- Active Goals: ${context.goalsList}

Rules:
1. Provide concise, friendly, and actionable advice.
2. Use markdown bullet points and bold text for clarity.
3. Refer to their actual numbers when helpful.
4. Keep answers under 200 words unless detail is requested.`;

        const messages = [
          { role: 'system', content: systemPrompt },
          ...(Array.isArray(history) ? history.slice(-6) : []),
          { role: 'user', content: message }
        ];

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey.trim()}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages,
            temperature: 0.7,
            max_tokens: 450
          })
        });

        if (response.ok) {
          const data = await response.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) {
            return res.status(200).json({
              success: true,
              reply,
              source: 'openai',
              apiKeyConfigured: true
            });
          }
        } else {
          const errData = await response.text();
          console.warn('OpenAI API returned error status, falling back to smart rules:', errData);
        }
      } catch (openAiErr) {
        console.warn('OpenAI API request failed, falling back to smart rules:', openAiErr.message);
      }
    }

    // Fallback: Smart Financial Rule Engine
    const ruleReply = generateRuleBasedReply(message, context);
    const notice = apiKey 
      ? '' 
      : '\n\n*(Note: Running with SpendWise Smart Financial Engine. Add your OPENAI_API_KEY in the backend .env to enable OpenAI generation.)*';

    return res.status(200).json({
      success: true,
      reply: ruleReply + notice,
      source: 'rule-engine',
      apiKeyConfigured: Boolean(apiKey && apiKey.trim() !== '')
    });
  } catch (error) {
    console.error('AI chat error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process AI question.'
    });
  }
};
