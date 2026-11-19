// SpendWise Main App Component
import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CurrencyProvider } from './context/CurrencyContext';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import SplitBillsPage from './pages/SplitBillsPage';
import BudgetsPage from './pages/BudgetsPage';
import GoalsPage from './pages/GoalsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AiAssistantPage from './pages/AiAssistantPage';

// Authenticated Layout Wrapper
function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Map route to human-readable header titles
  const getHeaderMeta = () => {
    switch (location.pathname) {
      case '/':
        return { title: 'Dashboard', subtitle: 'Overview of your personal finances' };
      case '/transactions':
        return { title: 'Transactions', subtitle: 'Detailed record of income and expenses' };
      case '/subscriptions':
        return { title: 'Subscriptions & Recurring', subtitle: 'Track automated charges and upcoming renewals' };
      case '/split-bills':
        return { title: 'Split Bills & Shared', subtitle: 'Manage group expenses and settle debts with friends' };
      case '/budgets':
        return { title: 'Budgets', subtitle: 'Track and enforce monthly category limits' };
      case '/goals':
        return { title: 'Savings Goals', subtitle: 'Set targets and track financial milestones' };
      case '/analytics':
        return { title: 'Analytics', subtitle: 'In-depth visual reports and spending trends' };
      case '/ai-assistant':
        return { title: 'AI Financial Advisor', subtitle: 'Smart guidance powered by AI' };
      default:
        return { title: 'SpendWise', subtitle: 'Personal Finance Manager' };
    }
  };

  const { title, subtitle } = getHeaderMeta();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex">
      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header 
          title={title} 
          subtitle={subtitle} 
          onOpenSidebar={() => setSidebarOpen(true)} 
        />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/split-bills" element={<SplitBillsPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/ai-assistant" element={<AiAssistantPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// Route Gatekeeper
function MainContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-[var(--text-secondary)]">Loading SpendWise...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <AppLayout />;
}

export default function App() {
  return (
    <ThemeProvider>
      <CurrencyProvider>
        <AuthProvider>
          <BrowserRouter>
            <MainContent />
          </BrowserRouter>
        </AuthProvider>
      </CurrencyProvider>
    </ThemeProvider>
  );
}
