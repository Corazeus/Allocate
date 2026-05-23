import React, { useState } from 'react'
import { Card, CardTitle, Modal, Field, Input, Select, BtnPrimary, BtnOutline, CatPill, Empty } from '../components/ui'

const CATS = ['food', 'transport', 'entertainment', 'utilities', 'health', 'shopping', 'other']

const ALLOC_OPTIONS = [
  { key: 'needs',   label: 'Needs',   color: '#2B5CE6', desc: 'Essentials' },
  { key: 'wants',   label: 'Wants',   color: '#1A7A4A', desc: 'Lifestyle' },
  { key: 'savings', label: 'Savings', color: '#7C3AED', desc: 'Future' },
]

function today() { return new Date().toISOString().split('T')[0] }

export default function Expenses({ data, save, fmt }) {
  const [modal, setModal] = useState(null) // 'add' | 'presets' | null
  const [filter, setFilter] = useState('')
  const [form, setForm] = useState({ amount: '', category: 'food', date: today(), note: '', allocation: 'needs' })
  const [presetForm, setPresetForm] = useState({ name: '', amount: '', category: 'food', allocation: 'needs' })

  // Per-allocation available balances
  const totalIncome = data.earnings.reduce((s, e) => s + e.amount, 0)
  const allocSpent = { needs: 0, wants: 0, savings: 0 }
  data.expenses.forEach(e => {
    if (e.allocation && allocSpent[e.allocation] !== undefined) allocSpent[e.allocation] += e.amount
  })
  const allocAvailable = {
    needs:   totalIncome * data.allocation.needs   / 100 - allocSpent.needs,
    wants:   totalIncome * data.allocation.wants   / 100 - allocSpent.wants,
    savings: totalIncome * data.allocation.savings / 100 - allocSpent.savings,
  }

  const enteredAmount = parseFloat(form.amount)
  const isOverBudget = form.amount && !isNaN(enteredAmount) && enteredAmount > allocAvailable[form.allocation]

  function quickAdd(preset) {
    const exp = {
      id: Date.now(),
      amount: preset.amount,
      category: preset.category,
      allocation: preset.allocation || 'needs',
      date: today(),
      note: preset.name,
    }
    save({ expenses: [...data.expenses, exp] })
  }

  function addExpense() {
    if (!form.amount || isNaN(parseFloat(form.amount))) return
    const exp = {
      id: Date.now(),
      amount: parseFloat(form.amount),
      category: form.category,
      allocation: form.allocation,
      date: form.date || today(),
      note: form.note,
    }
    save({ expenses: [...data.expenses, exp] })
    setModal(null)
    setForm({ amount: '', category: 'food', date: today(), note: '', allocation: 'needs' })
  }

  function deleteExpense(id) {
    save({ expenses: data.expenses.filter(e => e.id !== id) })
  }

  function addPreset() {
    if (!presetForm.name.trim() || !presetForm.amount) return
    const preset = {
      id: Date.now(),
      name: presetForm.name.trim(),
      amount: parseFloat(presetForm.amount),
      category: presetForm.category,
      allocation: presetForm.allocation,
    }
    save({ presets: [...data.presets, preset] })
    setPresetForm({ name: '', amount: '', category: 'food', allocation: 'needs' })
  }

  function deletePreset(id) {
    save({ presets: data.presets.filter(p => (p.id || p.name) !== id) })
  }

  const filtered = [...data.expenses]
    .filter(e => !filter || e.category === filter)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <div className="fade-in">

      {/* Quick add */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <CardTitle style={{ margin: 0 }}>Quick add</CardTitle>
          <button
            onClick={() => setModal('presets')}
            className="text-[12px] font-medium text-[#2B5CE6] hover:underline"
          >
            Manage presets
          </button>
        </div>
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
        <BtnOutline className="w-full justify-center" onClick={() => setModal('add')}>
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
        {filtered.length ? filtered.map(e => {
          const allocOpt = ALLOC_OPTIONS.find(a => a.key === e.allocation)
          return (
            <div key={e.id} className="flex items-center justify-between py-3 border-b border-[#F0EDE6] last:border-0">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <CatPill cat={e.category} />
                  {allocOpt && (
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: allocOpt.color + '22',
                        color: allocOpt.color,
                      }}
                    >
                      {allocOpt.label}
                    </span>
                  )}
                  {e.note && <span className="text-[13px] text-[#6B6458]">{e.note}</span>}
                </div>
                <p className="text-[11px] text-[#9C948A] mt-0.5">{e.date}</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{fmt(e.amount)}</p>
                <button onClick={() => deleteExpense(e.id)} className="text-[#9C948A] hover:text-[#C0392B] text-lg leading-none px-1">×</button>
              </div>
            </div>
          )
        }) : <Empty icon="🧾" text="No expenses found" />}
      </Card>

      {/* Add expense modal */}
      {modal === 'add' && (
        <Modal title="Add expense" onClose={() => setModal(null)}>

          {/* Allocation selector */}
          <div className="mb-4">
            <label className="block text-[12px] font-medium text-[#6B6458] mb-2">Deduct from</label>
            <div className="grid grid-cols-3 gap-2">
              {ALLOC_OPTIONS.map(({ key, label, color, desc }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, allocation: key }))}
                  className="rounded-xl border-2 p-3 text-left transition-all"
                  style={{
                    borderColor: form.allocation === key ? color : '#E3DECE',
                    opacity: form.allocation === key ? 1 : 0.55,
                  }}
                >
                  <div className="w-3 h-3 rounded-full mb-2" style={{ background: color }} />
                  <p className="text-[12px] font-semibold" style={{ color: form.allocation === key ? color : '#1A1814' }}>{label}</p>
                  <p className="text-[10px] text-[#9C948A]">{desc}</p>
                  <p className="text-[11px] font-medium mt-1.5" style={{ color }}>
                    {fmt(allocAvailable[key])} left
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Over-budget warning */}
          {isOverBudget && (
            <div className="bg-[#FDF0EF] border border-[#FBCDC8] rounded-lg px-3 py-2.5 mb-3">
              <p className="text-[12px] text-[#C0392B] leading-relaxed">
                ⚠ This amount exceeds your available <strong className="capitalize">{form.allocation}</strong> budget by{' '}
                {fmt(enteredAmount - allocAvailable[form.allocation])}. Your {form.allocation} allocation will go negative.
              </p>
            </div>
          )}

          <Field label="Amount">
            <Input
              type="number" placeholder="0.00"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <Select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATS.map(c => <option key={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Date">
              <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </Field>
          </div>
          <Field label="Note (optional)">
            <Input placeholder="e.g. Grab to work" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          </Field>
          <BtnPrimary onClick={addExpense}>Save expense</BtnPrimary>
        </Modal>
      )}

      {/* Manage presets modal */}
      {modal === 'presets' && (
        <Modal title="Quick-add presets" onClose={() => setModal(null)}>

          {/* Existing presets */}
          <div className="space-y-1 mb-5 max-h-44 overflow-y-auto">
            {data.presets.length ? data.presets.map((p, i) => (
              <div key={p.id || i} className="flex items-center justify-between py-2 border-b border-[#F0EDE6] last:border-0">
                <div>
                  <p className="text-[13px] font-medium">{p.name}</p>
                  <p className="text-[11px] text-[#9C948A]">
                    {p.category} · {fmt(p.amount)} · {p.allocation || 'needs'}
                  </p>
                </div>
                <button
                  onClick={() => deletePreset(p.id || p.name)}
                  className="text-[#9C948A] hover:text-[#C0392B] text-lg leading-none px-1"
                >
                  ×
                </button>
              </div>
            )) : <p className="text-[13px] text-[#9C948A] text-center py-3">No presets yet</p>}
          </div>

          {/* Add preset */}
          <div className="border-t border-[#E3DECE] pt-4">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-[#9C948A] mb-3">Add preset</p>
            <Field label="Name">
              <Input
                placeholder="e.g. Bus fare"
                value={presetForm.name}
                onChange={e => setPresetForm(f => ({ ...f, name: e.target.value }))}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount">
                <Input
                  type="number" placeholder="0.00"
                  value={presetForm.amount}
                  onChange={e => setPresetForm(f => ({ ...f, amount: e.target.value }))}
                />
              </Field>
              <Field label="Category">
                <Select value={presetForm.category} onChange={e => setPresetForm(f => ({ ...f, category: e.target.value }))}>
                  {CATS.map(c => <option key={c}>{c}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Deduct from">
              <div className="flex gap-2">
                {ALLOC_OPTIONS.map(({ key, label, color }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPresetForm(f => ({ ...f, allocation: key }))}
                    className="flex-1 py-2 rounded-lg border-2 text-[12px] font-medium transition-all"
                    style={
                      presetForm.allocation === key
                        ? { background: color, borderColor: color, color: '#fff' }
                        : { background: '#fff', borderColor: '#E3DECE', color: '#6B6458' }
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>
            <BtnPrimary onClick={addPreset}>Add preset</BtnPrimary>
          </div>
        </Modal>
      )}
    </div>
  )
}
