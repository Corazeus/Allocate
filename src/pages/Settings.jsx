import React from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { Card, CardTitle, BtnOutline } from '../components/ui'

const CURRENCIES = [
  { symbol: '₱', label: '₱ PHP — Philippine Peso' },
  { symbol: '₹', label: '₹ INR — Indian Rupee' },
  { symbol: '$', label: '$ USD — US Dollar' },
  { symbol: '€', label: '€ EUR — Euro' },
  { symbol: '£', label: '£ GBP — British Pound' },
  { symbol: '¥', label: '¥ JPY — Japanese Yen' },
]

export default function Settings({ user, data, save }) {
  function clearAll() {
    if (!confirm('Delete ALL data? This cannot be undone.')) return
    save({
      earnings: [], expenses: [],
      allocation: { needs: 50, wants: 30, savings: 20 },
      sharedUsers: [],
      sharedDashboardIds: [],
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
    </div>
  )
}
