# 💰 SpendWise — Enterprise-Grade Personal Finance & FinTech Platform

SpendWise is a full-stack personal finance platform built with **React 19**, **Vite**, **Node.js**, **Express**, **MongoDB (Mongoose)**, and **Recharts**. Engineered with real-world FinTech workflows, SpendWise goes far beyond simple expense trackers by including **recurring subscription tracking**, **peer-to-peer bill splitting**, **batch CSV ingestion & exports**, **heuristic financial health scoring**, and **smart AI advisory**.

---

## 🌟 Resume Highlights & Standout Features

### 1. 🔁 Recurring Subscriptions & Cash Flow Forecasting
- Automated recurring cost tracking for SaaS, gym memberships, rent, and streaming services.
- **Dynamic Renewal Countdown:** Automatically flags bills renewing within 7 days with priority alerts.
- **Monthly Burn Calculation:** Converts weekly, monthly, and annual commitments into a normalized monthly subscription burn rate.
- Toggle subscriptions between `Active`, `Paused`, and `Cancelled`.

### 2. 👥 Split Expenses & Group Debt Settlement (Splitwise-style)
- Multi-party expense splitting for dinners, road trips, and apartment rent.
- **Interactive Settlement Tracker:** Instant 1-click payment status toggle for individual friends.
- Real-time balance calculations: **"You Are Owed"** vs. **"You Owe"** with net debt position.
- Automatic **"Split Equally"** calculator with remainder gap distribution.

### 3. 📂 Batch CSV Data Ingestion & Export Engine
- **Client-Side CSV Parsing:** Upload bank statements or spreadsheet exports with instant tabular preview.
- **Batch Transaction Ingestion:** Validates columns (`Date`, `Type`, `Category`, `Amount`, `Description`) and performs bulk database inserts.
- **One-Click Export:** Download RFC-compliant CSV files with custom date-range filters.

### 4. 🧮 Heuristic Financial Health Score & Emergency Survival Runway
- **Survival Runway Calculator:** Automatically computes how many months your current savings can sustain your lifestyle based on your average monthly burn rate (`Total Balance / Monthly Burn`).
- **4-Pillar Composite Scoring (0–100):**
  1. *Savings Rate Pillar* (up to 35 pts)
  2. *Emergency Liquidity Runway* (up to 25 pts)
  3. *Budget Discipline & Limit Enforcement* (up to 25 pts)
  4. *Fixed Subscription Burden* (up to 15 pts)
- Generates algorithmic letter grades (`A+`, `B`, `C`, `D`) and tailored recommendations.

### 5. 🌍 Multi-Currency Localization (USD, INR, EUR, GBP)
- Global currency switcher in the header with persistent state.
- Formats every transaction, budget, goal, and metric into your preferred currency locale (`$`, `₹`, `€`, `£`).

### 6. 🔐 Secure Authentication & Strict Data Isolation
- **bcryptjs** password hashing (10 salt rounds).
- **JWT** (JSON Web Token) bearer authentication.
- Strict multi-tenant data separation (`req.user.id` validation on every query).

### 7. 📊 Real-Time Financial Dashboard & Recharts Analytics
- Real-time metrics: Total Balance, Monthly Income, Monthly Expense, Savings Rate, and Runway.
- 6-Month Income vs. Expense Bar Chart.
- Net Savings Surplus Growth Area Chart.
- Expense Distribution Donut / Pie Chart with category ranking bars.

### 8. 🤖 AI Financial Advisor (OpenAI + Intelligent Fallback)
- Backend-secured **OpenAI API** (`gpt-4o-mini`) integration.
- **Built-in Smart Financial Rule Engine:** Automatically activates if no API key is set, analyzing your real database figures to answer budgeting and 50/30/20 questions.

### 9. 🎨 Modern Fintech UI
- Dark & Light mode toggle with smooth CSS variable transitions.
- Fully responsive sidebar drawer for desktop, tablet, and mobile displays.

---

## 📄 How to Feature This Project on Your Resume (STAR Method)

Here are high-impact bullet points ready to copy and paste directly into your resume:

> **SpendWise — Full-Stack Personal Finance & FinTech Web Platform**  
> *Tech Stack: React.js, Vite, Node.js, Express.js, MongoDB, Mongoose, Recharts, Tailwind CSS, JWT, OpenAI API*
>
> - **Architected an enterprise personal finance web application** featuring real-time cash flow monitoring, multi-currency localization (USD, INR, EUR, GBP), and strict JWT/bcrypt user data isolation.
> - **Engineered a Recurring Subscription Engine** that normalizes weekly/monthly/annual billing cycles, forecasts monthly fixed burn rate, and delivers 7-day automated renewal alerts.
> - **Built a Peer-to-Peer Bill Splitter module** (Splitwise-style) calculating multi-party debt obligations, net settlement positions, and real-time payment status toggles.
> - **Developed an automated Batch CSV Ingestion Pipeline & Export Engine** enabling client-side statement parsing, preview verification, and high-throughput bulk database operations.
> - **Designed a Heuristic Financial Health & Emergency Runway Algorithm** evaluating liquidity survival runway based on 3-month burn rates and a 4-pillar composite creditworthiness index (0–100).
> - **Integrated OpenAI GPT-4o-mini API with an intelligent local fallback engine**, delivering personalized budgeting guidance tailored to live database transactions even without an API key.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, JavaScript (ES6+), Tailwind CSS v4, Lucide React Icons |
| **Charts** | Recharts (Responsive Bar, Area, and Donut charts) |
| **Backend** | Node.js, Express.js, RESTful APIs, JWT (`jsonwebtoken`), Password Hashing (`bcryptjs`), CORS |
| **Database** | MongoDB with Mongoose + transparent local JSON fallback for zero-friction setup |
| **AI Integration** | OpenAI API (`gpt-4o-mini`) + Built-in Rule-Based Financial Advisor |

---

## ⚡ Step-by-Step Setup Guide

### 1. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd spendwise/backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   *The server starts listening on `http://localhost:5000`.*

4. *(Optional)* Run backend self-tests:
   ```bash
   node test-backend.js
   node test-new-features.js
   ```

---

### 2. Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd spendwise/frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser at:
   ```
   http://localhost:5173
   ```

---

## 💡 Quick Demo Credentials
- On the login page, click **"Fill with demo credentials"**:
  - **Email:** `demo@spendwise.io`
  - **Password:** `spendwise123`
- Preloaded with realistic starter data for transactions, recurring subscriptions, split bills, and savings goals!

---

## 📄 License
Open-source and free for personal and educational use.
