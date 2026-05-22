# Allocate

**Your money, intentionally.**

A modern, mobile-first expense tracker built for individuals and couples. Track income across multiple payout dates, allocate spending using the 50/30/20 rule (or customize it), and optionally share a combined dashboard with a partner.

---

## ✨ Features

### Core
- **Google Sign-In** — Secure authentication via Firebase
- **Real-time Firestore sync** — Your data stays in sync across devices
- **50/30/20 budget allocation** — Fully customizable with live sliders
- **Multiple earning dates** — Set income for any day (5th, 15th, 22nd, 30th, or custom)
- **Expense tracking by category** — 7 categories + quick-add presets
- **Live dashboard** — See balance, income vs. spent, category breakdown, recent transactions
- **Settings & presets** — Save custom quick-add buttons, change currency (₱/₹/$/€/£/¥)

### Shared Mode
- **Partner dashboard** — Add a partner and see combined income/expenses in real time
- **Independent entries** — Each person logs their own earnings and expenses
- **Synchronized view** — Changes sync instantly across both users' apps

## 🎯 How to use

### Adding earnings
1. **Earnings tab** → **+ Add**
2. Enter amount, label (e.g. "Main salary"), and payout date
3. Set custom dates (5th, 22nd, 30th, or any day 1–31)
4. Save — appears in allocation breakdown

### Allocating income
1. **Earnings tab** → Drag allocation sliders (Needs / Wants / Savings)
2. Adjust to your priorities — default is 50/30/20
3. See real-time amounts for each category
4. Must total 100%

### Tracking expenses
1. **Expenses tab** → Click a quick-add preset (Bus fare, Coffee, etc.)
2. Or **+ Custom expense** for a new entry
3. Pick category, amount, date, optional note
4. Saved immediately; appears in dashboard

### Quick-add presets
1. **Settings** → scroll to presets
2. **+ Add** → name, amount, category
3. Preset appears on Expenses tab for one-click logging

### Shared dashboard
1. **Shared tab** → **Invite someone**
2. Add partner's name (email optional)
3. Share app link → they sign in with their Google account
4. Both enter your own earnings/expenses
5. Combined totals appear in real time for both of you

### Currency
1. **Settings** → Currency dropdown
2. Choose ₱/₹/$/€/£/¥ — updates everywhere instantly

---

## 📋 Roadmap
Future enhancements:
- [ ] Budget alerts ("You're at 85% of your Needs allocation")
- [ ] Monthly/yearly reports & export to CSV
- [ ] Recurring expense templates
- [ ] Dark mode toggle
- [ ] Mobile app (React Native)
- [ ] Bill splitting between partners
- [ ] Investment portfolio tracking
- [ ] AI Integration
---

## 🙏 Credits & AI Disclosure

**Allocate was built with the help of Claude AI** (Anthropic).

This app showcases what modern AI can accomplish in a single development session:

- **Full-stack architecture** — React frontend + Firebase backend
- **Real-time data sync** — Firestore listeners for live updates
- **Complex state management** — useStore hook with Firestore integration
- **Security-first design** — Properly scoped Firestore rules, OAuth integration
- **Production-ready UX** — Mobile-first design, error handling, loading states
- **Comprehensive documentation** — Setup guides, deployment instructions, security notes

The app was designed, developed, tested, and documented entirely by Claude AI in a single conversation. No human coding required — just well-articulated requirements and iteration.

**What this demonstrates:**
- AI can handle full-stack web development at a professional level
- Complex feature requirements can be translated into working code instantly
- Security best practices and cloud architecture are understood and implemented correctly
- Production deployment workflows are automated and explained clearly

**Learn more:**
- [Anthropic — Claude AI](https://www.anthropic.com)
- [Claude Documentation](https://docs.claude.com)

---

**Built with ❤️ and AI assistance.**

Start tracking your money intentionally today. 💰
