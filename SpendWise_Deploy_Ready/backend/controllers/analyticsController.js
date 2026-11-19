// Analytics Controller
// Computes real financial statistics, monthly income/expense breakdowns, and category charts.
// STRICTLY uses actual database records - no fake statistics.

const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Subscription = require('../models/Subscription');

// @desc    Get overall financial summary for the dashboard
// @route   GET /api/analytics/summary
exports.getSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const transactions = await Transaction.find({ userId });

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalIncome = 0;
    let totalExpense = 0;
    let thisMonthIncome = 0;
    let thisMonthExpense = 0;

    transactions.forEach(t => {
      const amt = Number(t.amount) || 0;
      const tDate = new Date(t.date);
      const isThisMonth = tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;

      if (t.type === 'income') {
        totalIncome += amt;
        if (isThisMonth) thisMonthIncome += amt;
      } else if (t.type === 'expense') {
        totalExpense += amt;
        if (isThisMonth) thisMonthExpense += amt;
      }
    });

    const totalBalance = totalIncome - totalExpense;
    const thisMonthSavings = thisMonthIncome - thisMonthExpense;
    const savingsRate = thisMonthIncome > 0 
      ? Math.max(0, Math.round((thisMonthSavings / thisMonthIncome) * 100)) 
      : 0;

    // Monthly burn rate (using this month's expense or 100 as fallback)
    const monthlyBurnRate = thisMonthExpense > 0 ? thisMonthExpense : (totalExpense > 0 ? totalExpense : 0);
    const emergencyRunwayMonths = monthlyBurnRate > 0 && totalBalance > 0 
      ? Number((totalBalance / monthlyBurnRate).toFixed(1)) 
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalBalance: Number(totalBalance.toFixed(2)),
        totalIncome: Number(totalIncome.toFixed(2)),
        totalExpense: Number(totalExpense.toFixed(2)),
        thisMonthIncome: Number(thisMonthIncome.toFixed(2)),
        thisMonthExpense: Number(thisMonthExpense.toFixed(2)),
        thisMonthSavings: Number(thisMonthSavings.toFixed(2)),
        savingsRate,
        monthlyBurnRate: Number(monthlyBurnRate.toFixed(2)),
        emergencyRunwayMonths,
        transactionCount: transactions.length
      }
    });
  } catch (error) {
    console.error('Get summary error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate summary.'
    });
  }
};

// @desc    Get monthly income vs expense analytics (last 6 months)
// @route   GET /api/analytics/monthly
exports.getMonthlyAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const transactions = await Transaction.find({ userId });

    const monthsMap = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();

    // Prepare last 6 months buckets
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthsMap[key] = {
        month: label,
        income: 0,
        expense: 0,
        savings: 0
      };
    }

    // Populate with real user transaction data
    transactions.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthsMap[key]) {
        const amt = Number(t.amount) || 0;
        if (t.type === 'income') {
          monthsMap[key].income += amt;
        } else if (t.type === 'expense') {
          monthsMap[key].expense += amt;
        }
      }
    });

    const monthlyData = Object.values(monthsMap).map(m => ({
      month: m.month,
      income: Number(m.income.toFixed(2)),
      expense: Number(m.expense.toFixed(2)),
      savings: Number((m.income - m.expense).toFixed(2))
    }));

    return res.status(200).json({
      success: true,
      data: monthlyData
    });
  } catch (error) {
    console.error('Get monthly analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate monthly analytics.'
    });
  }
};

// @desc    Get expense breakdown by category
// @route   GET /api/analytics/categories
exports.getCategoryAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const transactions = await Transaction.find({ userId, type: 'expense' });

    const categoryMap = {};
    let totalExpense = 0;

    transactions.forEach(t => {
      const cat = t.category || 'Other';
      const amt = Number(t.amount) || 0;
      categoryMap[cat] = (categoryMap[cat] || 0) + amt;
      totalExpense += amt;
    });

    const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2)),
      percentage: totalExpense > 0 ? Math.round((value / totalExpense) * 100) : 0
    })).sort((a, b) => b.value - a.value);

    return res.status(200).json({
      success: true,
      totalExpense: Number(totalExpense.toFixed(2)),
      data: categoryData
    });
  } catch (error) {
    console.error('Get category analytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate category breakdown.'
    });
  }
};

// @desc    Get recent 5 transactions for dashboard
// @route   GET /api/analytics/recent
exports.getRecent = async (req, res) => {
  try {
    const userId = req.user.id;
    const transactions = await Transaction.find({ userId });
    
    // Sort newest first and pick top 5
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recent = transactions.slice(0, 5);

    return res.status(200).json({
      success: true,
      data: recent
    });
  } catch (error) {
    console.error('Get recent transactions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get recent transactions.'
    });
  }
};

// @desc    Calculate Comprehensive Financial Health Score & Emergency Runway
// @route   GET /api/analytics/financial-health
exports.getFinancialHealthScore = async (req, res) => {
  try {
    const userId = req.user.id;
    const [transactions, budgets, subscriptions] = await Promise.all([
      Transaction.find({ userId }),
      Budget.find({ userId }),
      Subscription.find({ userId })
    ]);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalIncome = 0;
    let totalExpense = 0;
    let thisMonthIncome = 0;
    let thisMonthExpense = 0;
    const categorySpending = {};

    transactions.forEach(t => {
      const amt = Number(t.amount) || 0;
      const d = new Date(t.date);
      const isThisMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;

      if (t.type === 'income') {
        totalIncome += amt;
        if (isThisMonth) thisMonthIncome += amt;
      } else if (t.type === 'expense') {
        totalExpense += amt;
        if (isThisMonth) {
          thisMonthExpense += amt;
          const cat = t.category || 'Other';
          categorySpending[cat] = (categorySpending[cat] || 0) + amt;
        }
      }
    });

    const totalBalance = totalIncome - totalExpense;
    const monthlyBurnRate = thisMonthExpense > 0 ? thisMonthExpense : (totalExpense > 0 ? totalExpense : 1);
    const emergencyRunwayMonths = totalBalance > 0 ? Number((totalBalance / monthlyBurnRate).toFixed(1)) : 0;
    const savingsRate = thisMonthIncome > 0 ? Math.max(0, Math.round(((thisMonthIncome - thisMonthExpense) / thisMonthIncome) * 100)) : 0;

    // Pillar 1: Savings Rate (Max 35 points)
    let savingsScore = 0;
    if (savingsRate >= 20) savingsScore = 35;
    else if (savingsRate >= 15) savingsScore = 28;
    else if (savingsRate >= 10) savingsScore = 20;
    else if (savingsRate > 0) savingsScore = 10;

    // Pillar 2: Emergency Runway (Max 25 points)
    let runwayScore = 0;
    if (emergencyRunwayMonths >= 6) runwayScore = 25;
    else if (emergencyRunwayMonths >= 3) runwayScore = 20;
    else if (emergencyRunwayMonths >= 1) runwayScore = 12;
    else if (emergencyRunwayMonths > 0) runwayScore = 5;

    // Pillar 3: Budget Discipline (Max 25 points)
    let budgetScore = 20;
    let overBudgetCount = 0;
    budgets.forEach(b => {
      const spent = categorySpending[b.category] || 0;
      if (spent > b.amount) overBudgetCount++;
    });
    if (budgets.length > 0) {
      if (overBudgetCount === 0) budgetScore = 25;
      else if (overBudgetCount === 1) budgetScore = 15;
      else budgetScore = 5;
    }

    // Pillar 4: Subscription Burden (Max 15 points)
    let totalMonthlySubs = 0;
    subscriptions.filter(s => s.status === 'active').forEach(s => {
      let cost = Number(s.amount) || 0;
      if (s.billingCycle === 'yearly') cost /= 12;
      else if (s.billingCycle === 'weekly') cost *= 4.33;
      totalMonthlySubs += cost;
    });

    const subRatio = thisMonthIncome > 0 ? (totalMonthlySubs / thisMonthIncome) : 0;
    let subscriptionScore = 15;
    if (subRatio > 0.3) subscriptionScore = 5;
    else if (subRatio > 0.15) subscriptionScore = 10;

    // Total Composite Score (0 - 100)
    let totalScore = Math.min(100, savingsScore + runwayScore + budgetScore + subscriptionScore);
    if (totalBalance < 0) {
      totalScore = Math.min(45, totalScore);
    }

    let grade = 'Fair';
    let gradeBadge = 'C';
    let statusColor = 'amber';

    if (totalScore >= 85) {
      grade = 'Excellent (Strong Financial Health)';
      gradeBadge = 'A+';
      statusColor = 'emerald';
    } else if (totalScore >= 70) {
      grade = 'Good (On the Right Track)';
      gradeBadge = 'B';
      statusColor = 'teal';
    } else if (totalScore >= 50) {
      grade = 'Fair (Opportunity to Optimize)';
      gradeBadge = 'C';
      statusColor = 'amber';
    } else {
      grade = 'Action Needed (Deficit / High Burn)';
      gradeBadge = 'D';
      statusColor = 'rose';
    }

    // Dynamic actionable recommendations based on actual numbers
    const recommendations = [];
    if (emergencyRunwayMonths < 3) {
      recommendations.push(`Build your emergency fund to cover at least 3 months of expenses (~$${(monthlyBurnRate * 3).toFixed(0)} needed).`);
    }
    if (savingsRate < 20) {
      recommendations.push(`Target saving 20% of your income. Currently saving ${savingsRate}% ($${Math.max(0, thisMonthIncome - thisMonthExpense).toFixed(0)} this month).`);
    }
    if (overBudgetCount > 0) {
      recommendations.push(`Review the ${overBudgetCount} budget categories that are exceeding their limits this month.`);
    }
    if (totalMonthlySubs > 0 && subRatio > 0.15) {
      recommendations.push(`Your recurring subscriptions total $${totalMonthlySubs.toFixed(0)}/mo (${Math.round(subRatio * 100)}% of income). Consider auditing unused tools.`);
    }
    if (recommendations.length === 0) {
      recommendations.push('Outstanding financial discipline! Consider allocating your surplus into high-yield savings or investments.');
    }

    return res.status(200).json({
      success: true,
      data: {
        score: totalScore,
        grade,
        gradeBadge,
        statusColor,
        emergencyRunwayMonths,
        monthlyBurnRate: Number(monthlyBurnRate.toFixed(2)),
        pillars: {
          savings: { score: savingsScore, max: 35, label: `Savings Rate (${savingsRate}%)` },
          runway: { score: runwayScore, max: 25, label: `Emergency Runway (${emergencyRunwayMonths} mos)` },
          budget: { score: budgetScore, max: 25, label: `Budget Discipline (${overBudgetCount} exceeded)` },
          subscriptions: { score: subscriptionScore, max: 15, label: `Recurring Load ($${totalMonthlySubs.toFixed(0)}/mo)` },
        },
        recommendations
      }
    });
  } catch (error) {
    console.error('Financial health score error:', error);
    return res.status(500).json({ success: false, message: 'Failed to calculate financial health score.' });
  }
};
