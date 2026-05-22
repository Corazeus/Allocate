import React from 'react'
import { Card, CardTitle, CatPill, Empty } from '../components/ui'

const CAT_COLORS = {
  food: '#B45309', transport: '#2B5CE6', entertainment: '#7C3AED',
  utilities: '#1A7A4A', health: '#C0392B', shopping: '#D97706', other: '#6B6458',
}

export default function Dashboard({ data, fmt }) {
  const totalIncome  = data.earnings.reduce((s, e) => s + e.amount, 0)
  const totalSpent   = data.expenses.reduce((s, e) => s + e.amount, 0)
  const balance      = totalIncome - totalSpent
  const { needs, wants, savings } = data.allocation

  const catTotals = {}
  data.expenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount })
  const catEntries = Object.entries(catTotals).sort((a, b) => b[1] - a[1])
  const maxCat = catEntries[0]?.[1] || 1

  const recent = [...data.expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6)

  return (
    <div className="fade-in">
      {/* Hero */}
      <div className="bg-[#1A1814] text-white rounded-xl p-6 mb-4">
        <p className="text-[11px] tracking-widest uppercase opacity-50 mb-1">Net balance</p>
        <p className="serif text-[2.6rem] leading-none mb-5">
          <span className="text-[1.1rem] opacity-40 mr-1">{balance < 0 ? '-' : ''}{data.currency}</span>
          {Math.abs(balance).toLocaleString()}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/[.08] rounded-lg p-3">
            <p className="text-[10px] tracking-wider uppercase opacity-50 mb-0.5">Income</p>
            <p className="font-medium text-[#69F0AE]">{fmt(totalIncome)}</p>
          </div>
          <div className="bg-white/[.08] rounded-lg p-3">
            <p className="text-[10px] tracking-wider uppercase opacity-50 mb-0.5">Spent</p>
            <p className="font-medium text-[#FF8A80]">{fmt(totalSpent)}</p>
          </div>
        </div>
      </div>

      {/* Allocation */}
      <Card>
        <CardTitle>Allocation — {needs}/{wants}/{savings}</CardTitle>
        <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-4">
          <div style={{ flex: needs, background: 'var(--needs)' }} className="rounded-full transition-all duration-500" />
          <div style={{ flex: wants, background: 'var(--wants)' }} className="rounded-full transition-all duration-500" />
          <div style={{ flex: savings, background: 'var(--savings)' }} className="rounded-full transition-all duration-500" />
        </div>
        <div className="space-y-3">
          {[
            { label: 'Needs',   key: 'needs',   color: 'var(--needs)',   desc: 'Essentials' },
            { label: 'Wants',   key: 'wants',   color: 'var(--wants)',   desc: 'Lifestyle' },
            { label: 'Savings', key: 'savings', color: 'var(--savings)', desc: 'Future' },
          ].map(({ label, key, color, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                <div>
                  <p className="text-[14px] font-medium">{label}</p>
                  <p className="text-[11px] text-[#9C948A]">{desc}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[13px] font-medium text-[#6B6458]">{data.allocation[key]}%</p>
                <p className="text-[12px] text-[#9C948A]">{fmt(totalIncome * data.allocation[key] / 100)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Category breakdown */}
      <Card>
        <CardTitle>Spending by category</CardTitle>
        {catEntries.length ? catEntries.map(([cat, total]) => (
          <div key={cat} className="mb-3">
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
              <div className="flex items-center gap-2">
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
