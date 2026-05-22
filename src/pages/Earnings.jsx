import React, { useState } from 'react'
import { Card, CardTitle, Modal, Field, Input, Select, BtnPrimary, Empty } from '../components/ui'

const DAYS = [1, 5, 10, 15, 22, 25, 30]

function ordinal(n) {
  const s = ['th','st','nd','rd']
  const v = n % 100
  return n + (s[(v-20)%10] || s[v] || s[0])
}

export default function Earnings({ data, save, fmt }) {
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ amount: '', label: '', day: 15, customDay: '' })
  const [customDay, setCustomDay] = useState(false)

  const totalIncome = data.earnings.reduce((s, e) => s + e.amount, 0)
  const { needs, wants, savings } = data.allocation
  const total = needs + wants + savings

  function updateAlloc(key, val) {
    save({ allocation: { ...data.allocation, [key]: parseInt(val) } })
  }

  function addEarning() {
    if (!form.amount || isNaN(form.amount)) return
    const day = customDay ? parseInt(form.customDay) : form.day
    const earning = { id: Date.now(), amount: parseFloat(form.amount), label: form.label || 'Income', day }
    save({ earnings: [...data.earnings, earning] })
    setModal(false)
    setForm({ amount: '', label: '', day: 15, customDay: '' })
    setCustomDay(false)
  }

  function deleteEarning(id) {
    save({ earnings: data.earnings.filter(e => e.id !== id) })
  }

  return (
    <div className="fade-in">
      {/* Allocation sliders */}
      <Card>
        <CardTitle>Income allocation</CardTitle>
        <div className="space-y-5 mb-2">
          {[
            { key: 'needs',   label: 'Needs',   color: '#2B5CE6', desc: 'Rent, bills, groceries' },
            { key: 'wants',   label: 'Wants',   color: '#1A7A4A', desc: 'Dining, entertainment, lifestyle' },
            { key: 'savings', label: 'Savings', color: '#7C3AED', desc: 'Emergency fund, investments' },
          ].map(({ key, label, color, desc }) => (
            <div key={key}>
              <div className="flex justify-between items-baseline mb-1.5">
                <div>
                  <span className="text-[14px] font-medium">{label}</span>
                  <span className="text-[11px] text-[#9C948A] ml-2">{desc}</span>
                </div>
                <div className="text-right ml-4">
                  <span className="text-[14px] font-medium text-[#6B6458]">{data.allocation[key]}%</span>
                  <span className="text-[12px] text-[#9C948A] ml-1.5">{fmt(totalIncome * data.allocation[key] / 100)}</span>
                </div>
              </div>
              <input
                type="range" min="0" max="100"
                value={data.allocation[key]}
                onChange={e => updateAlloc(key, e.target.value)}
                style={{ accentColor: color }}
                className="w-full h-1"
              />
            </div>
          ))}
        </div>
        <p className={`text-[11px] mt-3 ${total === 100 ? 'text-[#1A7A4A]' : 'text-[#B45309]'}`}>
          Total: {total}% {total !== 100 ? '⚠ Adjust sliders to equal 100%' : '✓ Balanced'}
        </p>
      </Card>

      {/* Earning schedules */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle style={{ margin: 0 }}>Earning schedules</CardTitle>
          <button
            onClick={() => setModal(true)}
            className="text-[13px] font-medium text-white bg-[#2B5CE6] hover:bg-[#244dd4] px-3 py-1.5 rounded-lg transition-colors"
          >
            + Add
          </button>
        </div>

        {data.earnings.length ? (
          <>
            {data.earnings.map(e => (
              <div key={e.id} className="flex items-center justify-between py-3 border-b border-[#F0EDE6] last:border-0">
                <div>
                  <p className="text-[14px] font-medium">{e.label}</p>
                  <p className="text-[12px] text-[#9C948A] mt-0.5">Every {ordinal(e.day)} of the month</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-[15px]">{fmt(e.amount)}</p>
                  <button onClick={() => deleteEarning(e.id)} className="text-[#9C948A] hover:text-[#C0392B] text-lg leading-none px-1">×</button>
                </div>
              </div>
            ))}
            <div className="mt-3 pt-3 border-t border-[#E3DECE] flex justify-between">
              <p className="text-[13px] text-[#6B6458] font-medium">Total monthly income</p>
              <p className="text-[13px] font-semibold">{fmt(totalIncome)}</p>
            </div>
          </>
        ) : <Empty icon="💰" text="No earnings added yet" />}
      </Card>

      {modal && (
        <Modal title="Add earning" onClose={() => setModal(false)}>
          <Field label="Amount">
            <Input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} autoFocus />
          </Field>
          <Field label="Label (e.g. Main salary, Freelance)">
            <Input placeholder="Income" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} />
          </Field>
          <Field label="Payout date">
            <Select
              value={customDay ? 'custom' : form.day}
              onChange={e => {
                if (e.target.value === 'custom') { setCustomDay(true) }
                else { setCustomDay(false); setForm({ ...form, day: parseInt(e.target.value) }) }
              }}
            >
              {DAYS.map(d => <option key={d} value={d}>{ordinal(d)} of the month</option>)}
              <option value="custom">Custom day…</option>
            </Select>
          </Field>
          {customDay && (
            <Field label="Custom day (1–31)">
              <Input type="number" min="1" max="31" placeholder="e.g. 28" value={form.customDay} onChange={e => setForm({ ...form, customDay: e.target.value })} />
            </Field>
          )}
          <BtnPrimary onClick={addEarning}>Save earning</BtnPrimary>
        </Modal>
      )}
    </div>
  )
}
