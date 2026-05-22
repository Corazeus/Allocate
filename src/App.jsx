import React, { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import { useStore } from './hooks/useStore'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Earnings from './pages/Earnings'
import Shared from './pages/Shared'
import Settings from './pages/Settings'

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'expenses',  label: 'Expenses' },
  { id: 'earnings',  label: 'Earnings' },
  { id: 'shared',    label: 'Shared' },
  { id: 'settings',  label: 'Settings' },
]

export default function App() {
  const [user, setUser] = useState(undefined) // undefined = loading
  const [tab, setTab] = useState('dashboard')
  const { data, save, syncing } = useStore(user)

  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u || null))
  }, [])

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#2B5CE6] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Login />

  const fmt = (n) => data.currency + (n || 0).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  const pageProps = { data, save, fmt, user }

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-[#E3DECE] h-14 flex items-center justify-between px-4 sticky top-0 z-30">
        <span className="serif text-[1.25rem] text-[#1A1814]">Allocate</span>
        <div className="flex items-center gap-2">
          {syncing && (
            <div className="w-4 h-4 border-2 border-[#2B5CE6] border-t-transparent rounded-full animate-spin" />
          )}
          {user.photoURL
            ? <img src={user.photoURL} className="w-8 h-8 rounded-full border border-[#E3DECE]" alt="" />
            : <div className="w-8 h-8 rounded-full bg-[#F0EDE6] border border-[#E3DECE] flex items-center justify-center text-[12px] font-medium text-[#6B6458]">
                {user.displayName?.[0] || 'U'}
              </div>
          }
        </div>
      </header>

      {/* Tab nav */}
      <nav className="bg-white border-b border-[#E3DECE] flex overflow-x-auto sticky top-14 z-20 scrollbar-hide">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id
                ? 'border-[#2B5CE6] text-[#2B5CE6]'
                : 'border-transparent text-[#6B6458] hover:text-[#1A1814]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Page content */}
      <main className="flex-1 px-4 py-5 max-w-[640px] w-full mx-auto">
        {tab === 'dashboard' && <Dashboard {...pageProps} />}
        {tab === 'expenses'  && <Expenses  {...pageProps} />}
        {tab === 'earnings'  && <Earnings  {...pageProps} />}
        {tab === 'shared'    && <Shared    {...pageProps} />}
        {tab === 'settings'  && <Settings  {...pageProps} />}
      </main>
    </div>
  )
}
