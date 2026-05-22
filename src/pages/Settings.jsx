import React, { useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { Card, CardTitle, Modal, Field, Input, Select, BtnPrimary, BtnOutline } from '../components/ui'

const CURRENCIES = [
  { symbol: '₱', label: '₱ PHP — Philippine Peso' },
  { symbol: '₹', label: '₹ INR — Indian Rupee' },
  { symbol: '$', label: '$ USD — US Dollar' },
  { symbol: '€', label: '€ EUR — Euro' },
  { symbol: '£', label: '£ GBP — British Pound' },
  { symbol: '¥', label: '¥ JPY — Japanese Yen' },
]

const CATS = ['transport','food','entertainment','utilities','health','shopping','other']

export default function Settings({ user, data, save, fmt }) {
  const [presetModal, setPresetModal] = useState(false)
  const [form, setForm] = useState({ name: '', amount: '', category: 'transport' })

  function addPreset() {
    if (!form.name || !form.amount) return
    const preset = { id: Date.now(), name: form.name, amount: parseFloat(form.amount), category: form.category }
    save({ presets: [...data.presets, preset] })
    setPresetModal(false)
    setForm({ name: '', amount: '', category: 'transport' })
  }

  function deletePreset(id) {
    save({ presets: data.presets.filter(p => (p.id || p.name) !== id) })
  }

  function clearAll() {
    if (!confirm('Delete ALL data? This cannot be undone.')) return
    save({
      earnings: [], expenses: [],
      allocation: { needs: 50, wants: 30, savings: 20 },
      sharedUsers: [],
    })
  }

  return (
    <div className="fade-in">
      {/* Account */}
      <Card>
        <CardTitle>Account</CardTitle>
        <div className="flex items-center gap-3 mb-4">
          {user.photoURL
            ? <img src={user.photoURL} className="w-10 h-10 rounded-full" alt="" />
            : <div className="w-10 h-10 rounded-full bg-[#F0EDE6] border border-[#E3DECE] flex items-center justify-center text-[#6B6458] font-medium">{user.displayName?.[0] || 'U'}</div>
          }
          <div>
            <p className="font-medium text-[14px]">{user.displayName || 'User'}</p>
            <p className="text-[12px] text-[#9C948A]">{user.email}</p>
          </div>
        </div>
        <BtnOutline className="w-full justify-center" onClick={() => signOut(auth)}>Sign out</BtnOutline>
      </Card>

      {/* Currency */}
      <Card>
        <CardTitle>Currency</CardTitle>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[14px] font-medium">Display currency</p>
            <p className="text-[12px] text-[#9C948A]">Shown before all amounts</p>
          </div>
          <select
            value={data.currency}
            onChange={e => save({ currency: e.target.value })}
            className="text-[13px] px-3 py-2 border border-[#E3DECE] rounded-lg bg-white text-[#1A1814] focus:outline-none focus:border-[#2B5CE6]"
          >
            {CURRENCIES.map(c => <option key={c.symbol} value={c.symbol}>{c.label}</option>)}
          </select>
        </div>
      </Card>

      {/* Quick add presets */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle style={{ margin: 0 }}>Quick-add presets</CardTitle>
          <button
            onClick={() => setPresetModal(true)}
            className="text-[13px] font-medium text-[#2B5CE6] hover:underline"
          >
            + Add
          </button>
        </div>
        <div className="space-y-2">
          {data.presets.map((p, i) => (
            <div key={p.id || i} className="flex items-center justify-between py-2 border-b border-[#F0EDE6] last:border-0">
              <div>
                <p className="text-[14px] font-medium">{p.name}</p>
                <p className="text-[12px] text-[#9C948A]">{p.category} · {fmt(p.amount)}</p>
              </div>
              <button onClick={() => deletePreset(p.id || p.name)} className="text-[#9C948A] hover:text-[#C0392B] text-lg leading-none px-1">×</button>
            </div>
          ))}
        </div>
      </Card>

      {/* Danger zone */}
      <div className="bg-[#FDF0EF] border border-[#FBCDC8] rounded-xl p-5 mb-4">
        <p className="text-[13px] font-semibold text-[#C0392B] mb-1">Danger zone</p>
        <p className="text-[12px] text-[#C0392B] mb-3 opacity-75">Permanently deletes all your earnings and expenses. Cannot be undone.</p>
        <button
          onClick={clearAll}
          className="text-[13px] font-medium text-white bg-[#C0392B] hover:bg-[#a93226] px-4 py-2 rounded-lg transition-colors"
        >
          Clear all data
        </button>
      </div>

      {presetModal && (
        <Modal title="New quick-add preset" onClose={() => setPresetModal(false)}>
          <Field label="Name">
            <Input placeholder="e.g. Bus fare" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount">
              <Input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </Field>
            <Field label="Category">
              <Select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATS.map(c => <option key={c}>{c}</option>)}
              </Select>
            </Field>
          </div>
          <BtnPrimary onClick={addPreset}>Save preset</BtnPrimary>
        </Modal>
      )}
    </div>
  )
}
