import React from 'react'
import { Card, CardTitle, CatPill, Empty } from '../components/ui'

const CAT_COLORS = {
  food: '#B45309', transport: '#2B5CE6', entertainment: '#7C3AED',
  utilities: '#1A7A4A', health: '#C0392B', shopping: '#D97706', other: '#6B6458',
}

const ALLOC_CONFIG = [
  { label: 'Needs',   key: 'needs',   color: '#2B5CE6', desc: 'Essentials' },
  { label: 'Wants',   key: 'wants',   color: '#1A7A4A', desc: 'Lifestyle' },
  { label: 'Savings', key: 'savings', color: '#7C3AED', desc: 'Future' },
]

export default function Dashboard({ data, fmt }) {
  const totalIncome = data.earnings.reduce((s, e) => s + e.amount, 0)

  // Per-allocation spending — only expenses that carry an allocation field
  const allocSpent = { needs: 0, wants: 0, savings: 0 }
  data.expenses.forEach(e => {
    if (e.allocation && allocSpent[e.allocation] !== undefined) allocSpent[e.allocation] += e.amount
  })

  const catTotals = {}
  data.expenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount })
  const catEntries = Object.entries(catTotals).sort((a, b) => b[1] - a[1])
  const maxCat = catEntries[0]?.[1] || 1

  const recent = [...data.expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6)

  return (
    <div className="fade-in">

      {/* Hero — 3 allocation cards */}
      <div className="bg-[#1A1814] text-white rounded-xl p-5 mb-4">
        <p className="text-[10px] tracking-widest uppercase opacity-40 mb-4">Allocation overview</p>
        <div className="space-y-2.5">
          {ALLOC_CONFIG.map(({ label, key, color, desc }) => {
            const budget  = totalIncome * data.allocation[key] / 100
            const spent   = allocSpent[key]
            const balance = budget - spent
            return (
              <div key={key} className="bg-white/[.07] rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-[13px] font-semibold">{label}</span>
                    <span className="text-[10px] opacity-40">{desc}</span>
                  </div>
                  <span className="text-[11px] opacity-40 font-medium">{data.allocation[key]}%</span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest opacity-35 mb-0.5">Budget</p>
                    <p className="text-[13px] font-medium">{fmt(budget)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest opacity-35 mb-0.5">Balance</p>
                    <p className={`text-[13px] font-semibold ${balance < 0 ? 'text-[#FF8A80]' : 'text-[#69F0AE]'}`}>
                      {balance < 0 ? '-' : ''}{fmt(Math.abs(balance))}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest opacity-35 mb-0.5">Spent</p>
                    <p className="text-[13px] font-medium text-[#FF8A80]">{fmt(spent)}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Spending by allocation */}
      <Card>
        <CardTitle>Spending by allocation</CardTitle>
        {ALLOC_CONFIG.map(({ label, key, color }) => {
          const budget = totalIncome * data.allocation[key] / 100
          const spent  = allocSpent[key]
          const pct    = budget > 0 ? Math.min(spent / budget * 100, 100) : 0
          const over   = spent > budget
          return (
            <div key={key} className="mb-4 last:mb-0">
              <div className="flex justify-between items-baseline mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-[13px] font-medium">{label}</span>
                </div>
                <span className={`text-[12px] ${over ? 'text-[#C0392B] font-semibold' : 'text-[#6B6458]'}`}>
                  {fmt(spent)} / {fmt(budget)}
                </span>
              </div>
              <div className="h-2 bg-[#F0EDE6] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: over ? '#C0392B' : color }}
                />
              </div>
              {over && (
                <p className="text-[10px] text-[#C0392B] mt-1">Over budget by {fmt(spent - budget)}</p>
              )}
            </div>
          )
        })}
      </Card>

      {/* Category breakdown */}
      <Card>
        <CardTitle>Spending by category</CardTitle>
        {catEntries.length ? catEntries.map(([cat, total]) => (
          <div key={cat} className="mb-3 last:mb-0">
            <div className="flex justify-between text-[13px] mb-1">
              <span className="font-medium capitalize">{cat}</span>
              <span className="text-[#6B6458]">{fmt(total)}</span>
            </div>
            <div className="h-1.5 bg-[#F0EDE6] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(total / maxCat * 100).toFixed(1)}%`, background: CAT_COLORS[cat] || '#6B6458' }}
              />
            </div>
          </div>
        )) : <Empty icon="📊" text="No expenses yet" />}
      </Card>

      {/* Recent */}
      <Card>
        <CardTitle>Recent transactions</CardTitle>
        {recent.length ? recent.map(e => (
          <div key={e.id} className="flex items-center justify-between py-3 border-b border-[#F0EDE6] last:border-0">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CatPill cat={e.category} />
                {e.note && <span className="text-[13px] text-[#6B6458]">{e.note}</span>}
              </div>
              <p className="text-[11px] text-[#9C948A] mt-0.5">{e.date}</p>
            </div>
            <p className="font-semibold text-[15px]">{fmt(e.amount)}</p>
          </div>
        )) : <Empty icon="🧾" text="No transactions yet" />}
      </Card>
    </div>
  )
}
