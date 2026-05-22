import React, { useState } from 'react'
import { Card, CardTitle, Modal, Field, Input, Select, BtnPrimary, BtnOutline, CatPill, Empty } from '../components/ui'

const CATS = ['food', 'transport', 'entertainment', 'utilities', 'health', 'shopping', 'other']

export default function Expenses({ data, save, fmt }) {
  const [modal, setModal] = useState(false)
  const [filter, setFilter] = useState('')
  const [form, setForm] = useState({ amount: '', category: 'food', date: today(), note: '' })

  function today() { return new Date().toISOString().split('T')[0] }

  function quickAdd(preset) {
    const exp = { id: Date.now(), amount: preset.amount, category: preset.category, date: today(), note: preset.name }
    save({ expenses: [...data.expenses, exp] })
  }

  function addExpense() {
    if (!form.amount || isNaN(form.amount)) return
    const exp = { id: Date.now(), amount: parseFloat(form.amount), category: form.category, date: form.date || today(), note: form.note }
    save({ expenses: [...data.expenses, exp] })
    setModal(false)
    setForm({ amount: '', category: 'food', date: today(), note: '' })
  }

  function deleteExpense(id) {
    save({ expenses: data.expenses.filter(e => e.id !== id) })
  }

  const filtered = [...data.expenses]
    .filter(e => !filter || e.category === filter)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <div className="fade-in">
      {/* Quick add */}
      <Card>
        <CardTitle>Quick add</CardTitle>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {data.presets.map((p, i) => (
            <button
              key={p.id || i}
              onClick={() => quickAdd(p)}
              className="bg-[#F7F5F0] border border-[#E3DECE] rounded-lg p-3 text-left hover:bg-[#EEF2FD] hover:border-[#2B5CE6] transition-all active:scale-95"
            >
              <span className="block text-[13px] font-medium text-[#1A1814]">{p.name}</span>
              <span className="text-[11px] text-[#9C948A] mt-0.5 block">{fmt(p.amount)} · {p.category}</span>
            </button>
          ))}
        </div>
        <BtnOutline className="w-full justify-center" onClick={() => setModal(true)}>
          + Custom expense
        </BtnOutline>
      </Card>

      {/* All expenses */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle style={{ margin: 0 }}>All expenses</CardTitle>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="text-[12px] px-2 py-1 border border-[#E3DECE] rounded-lg bg-white text-[#6B6458] focus:outline-none"
          >
            <option value="">All</option>
            {CATS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        {filtered.length ? filtered.map(e => (
          <div key={e.id} className="flex items-center justify-between py-3 border-b border-[#F0EDE6] last:border-0">
            <div>
              <div className="flex items-center gap-2">
                <CatPill cat={e.category} />
                {e.note && <span className="text-[13px] text-[#6B6458]">{e.note}</span>}
              </div>
              <p className="text-[11px] text-[#9C948A] mt-0.5">{e.date}</p>
            </div>
            <div className="flex items-center gap-2">
              <p className="font-semibold">{fmt(e.amount)}</p>
              <button onClick={() => deleteExpense(e.id)} className="text-[#9C948A] hover:text-[#C0392B] text-lg leading-none px-1">×</button>
            </div>
          </div>
        )) : <Empty icon="🧾" text="No expenses found" />}
      </Card>

      {modal && (
        <Modal title="Add expense" onClose={() => setModal(false)}>
          <Field label="Amount">
            <Input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <Select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATS.map(c => <option key={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Date">
              <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </Field>
          </div>
          <Field label="Note (optional)">
            <Input placeholder="e.g. Grab to work" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
          </Field>
          <BtnPrimary onClick={addExpense}>Save expense</BtnPrimary>
        </Modal>
      )}
    </div>
  )
}
