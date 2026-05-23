import React, { useState } from 'react'
import { Card, CardTitle, Modal, Field, Input, Select, BtnPrimary, BtnOutline, CatPill, Empty } from '../components/ui'
import { useShared } from '../hooks/useShared'

const ALLOC_OPTIONS = [
  { key: 'needs',   label: 'Needs',   color: '#2B5CE6' },
  { key: 'wants',   label: 'Wants',   color: '#1A7A4A' },
  { key: 'savings', label: 'Savings', color: '#7C3AED' },
]

const CATS = ['food', 'transport', 'entertainment', 'utilities', 'health', 'shopping', 'other']

function Avatar({ photoURL, name, size = 8 }) {
  const cls = `w-${size} h-${size} rounded-full flex-shrink-0`
  if (photoURL) return <img src={photoURL} className={cls} alt="" />
  return (
    <div
      className={`${cls} bg-[#F0EDE6] border border-[#E3DECE] flex items-center justify-center font-semibold text-[#6B6458]`}
      style={{ fontSize: size * 1.4 + 'px' }}
    >
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

function today() { return new Date().toISOString().split('T')[0] }

function getDateFrom(period) {
  const now = new Date()
  if (period === 'month')     return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  if (period === 'lastMonth') return new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
  if (period === '3months')   return new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0]
  return null
}

function getDateTo(period) {
  if (period === 'lastMonth') {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
  }
  return null
}

export default function Shared({ data, save, fmt, user }) {
  const {
    dashboards, loading, initialLoading,
    createDashboard, joinDashboard, addContribution, addSharedExpense, leaveDashboard,
  } = useShared(user, data.sharedDashboardIds, save)

  const [activeId, setActiveId]       = useState(null)
  const [modal, setModal]             = useState(null) // 'create' | 'join' | 'contribute' | 'expense'
  const [createName, setCreateName]   = useState('')
  const [joinCode, setJoinCode]       = useState('')
  const [joinError, setJoinError]     = useState('')
  const [contribForm, setContribForm] = useState({ amount: '', note: '', allocation: 'needs' })
  const [expenseForm, setExpenseForm] = useState({ amount: '', category: 'food', note: '', date: today() })
  const [txTypeFilter, setTxTypeFilter] = useState('')
  const [txPeriod, setTxPeriod]       = useState('')
  const [copied, setCopied]           = useState(false)

  const activeDash = dashboards.find(d => d.id === activeId) || dashboards[0]

  async function handleCreate() {
    if (!createName.trim()) return
    const id = await createDashboard(createName.trim())
    if (id) { setActiveId(id); setModal(null); setCreateName('') }
  }

  async function handleJoin() {
    setJoinError('')
    const result = await joinDashboard(joinCode)
    if (result?.error) {
      setJoinError(result.error)
    } else {
      if (result?.docId) setActiveId(result.docId)
      setModal(null)
      setJoinCode('')
    }
  }

  async function handleContribute() {
    const amount = parseFloat(contribForm.amount)
    if (!amount || isNaN(amount) || !activeDash) return
    await addContribution(activeDash.id, { amount, note: contribForm.note, allocation: contribForm.allocation })
    save({
      expenses: [...data.expenses, {
        id: Date.now(),
        amount,
        category: 'other',
        allocation: contribForm.allocation,
        date: today(),
        note: `Shared: ${activeDash.name}`,
        isSharedContribution: true,
        dashboardId: activeDash.id,
      }],
    })
    setModal(null)
    setContribForm({ amount: '', note: '', allocation: 'needs' })
  }

  async function handleAddSharedExpense() {
    const amount = parseFloat(expenseForm.amount)
    if (!amount || isNaN(amount) || !activeDash) return
    await addSharedExpense(activeDash.id, {
      amount,
      category: expenseForm.category,
      note: expenseForm.note,
      date: expenseForm.date || today(),
    })
    setModal(null)
    setExpenseForm({ amount: '', category: 'food', note: '', date: today() })
  }

  function copyCode() {
    const code = activeDash?.shortCode || activeDash?.id || ''
    navigator.clipboard?.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  // Per-member contribution totals
  const memberTotals = {}
  activeDash?.members?.forEach(m => { memberTotals[m.uid] = { ...m, total: 0 } })
  activeDash?.contributions?.forEach(c => {
    if (memberTotals[c.uid]) memberTotals[c.uid].total += c.amount
    else memberTotals[c.uid] = { uid: c.uid, name: c.name, photoURL: c.photoURL, total: c.amount }
  })
  const totalContributions  = Object.values(memberTotals).reduce((s, m) => s + m.total, 0)
  const totalSharedExpenses = (activeDash?.sharedExpenses || []).reduce((s, e) => s + e.amount, 0)
  const myTotal             = memberTotals[user?.uid]?.total || 0
  const availableBalance    = totalContributions - totalSharedExpenses
  const spentPct            = totalContributions > 0 ? Math.min((totalSharedExpenses / totalContributions) * 100, 100) : 0

  // Transaction history (contributions + shared expenses merged and filtered)
  const dateFrom = getDateFrom(txPeriod)
  const dateTo   = getDateTo(txPeriod)
  const allTransactions = [
    ...(activeDash?.contributions  || []).map(c => ({ ...c, txType: 'contribution' })),
    ...(activeDash?.sharedExpenses || []).map(e => ({ ...e, txType: 'expense' })),
  ]
    .filter(tx => !txTypeFilter || tx.txType === txTypeFilter)
    .filter(tx => !dateFrom || tx.date >= dateFrom)
    .filter(tx => !dateTo   || tx.date <= dateTo)
    .sort((a, b) => b.id - a.id)

  // ── Loading ─────────────────────────────────────────────────────────
  if (initialLoading && data.sharedDashboardIds?.length > 0) {
    return (
      <div className="fade-in flex flex-col items-center justify-center pt-20">
        <div className="w-8 h-8 border-2 border-[#2B5CE6] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-[13px] text-[#9C948A]">Loading dashboards…</p>
      </div>
    )
  }

  // ── Landing ─────────────────────────────────────────────────────────
  if (dashboards.length === 0) {
    return (
      <div className="fade-in">
        <div className="flex flex-col items-center text-center pt-8 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#EEF2FD] flex items-center justify-center text-[2rem] mb-5">🔗</div>
          <h2 className="serif text-[1.5rem] mb-2 text-[#1A1814]">Shared Dashboards</h2>
          <p className="text-[13px] text-[#9C948A] mb-8 max-w-[280px] leading-relaxed">
            You're not in any shared dashboard yet. Create one or join with an invite code from a teammate.
          </p>
          <div className="w-full space-y-3">
            <BtnPrimary onClick={() => setModal('create')}>Create a dashboard</BtnPrimary>
            <BtnOutline className="w-full justify-center" onClick={() => setModal('join')}>
              Join with invite code
            </BtnOutline>
          </div>
        </div>

        {modal === 'create' && (
          <Modal title="Create shared dashboard" onClose={() => { setModal(null); setCreateName('') }}>
            <p className="text-[13px] text-[#6B6458] mb-4">
              Give your dashboard a name. A short 6-character invite code will be generated for others to join.
            </p>
            <Field label="Dashboard name">
              <Input placeholder="e.g. Household, Couple, Roommates" value={createName} onChange={e => setCreateName(e.target.value)} autoFocus />
            </Field>
            <BtnPrimary onClick={handleCreate} disabled={loading}>{loading ? 'Creating…' : 'Create dashboard'}</BtnPrimary>
          </Modal>
        )}

        {modal === 'join' && (
          <Modal title="Join a dashboard" onClose={() => { setModal(null); setJoinCode(''); setJoinError('') }}>
            <p className="text-[13px] text-[#6B6458] mb-4">
              Enter the 6-character invite code shared by the dashboard creator.
            </p>
            <Field label="Invite code">
              <Input
                placeholder="e.g. AB3K7P"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                autoFocus
                style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'monospace', fontSize: '16px' }}
              />
            </Field>
            {joinError && <p className="text-[12px] text-[#C0392B] mb-3">⚠ {joinError}</p>}
            <BtnPrimary onClick={handleJoin} disabled={loading}>{loading ? 'Joining…' : 'Join dashboard'}</BtnPrimary>
          </Modal>
        )}
      </div>
    )
  }

  // ── Dashboard view ──────────────────────────────────────────────────
  return (
    <div className="fade-in">

      {/* Dashboard tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-2 scrollbar-hide">
        {dashboards.map(d => (
          <button
            key={d.id}
            onClick={() => setActiveId(d.id)}
            className={`px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
              activeDash?.id === d.id
                ? 'bg-[#2B5CE6] text-white'
                : 'bg-white border border-[#E3DECE] text-[#6B6458] hover:bg-[#F0EDE6]'
            }`}
          >
            {d.name}
          </button>
        ))}
        <button
          onClick={() => setModal('create')}
          className="px-3 py-2 rounded-full text-[13px] font-medium bg-[#F0EDE6] text-[#6B6458] whitespace-nowrap flex-shrink-0 hover:bg-[#E3DECE] transition-colors"
        >
          + New
        </button>
      </div>

      {activeDash && (
        <>
          {/* Hero */}
          <div className="bg-[#1A1814] text-white rounded-xl p-5 mb-4">
            <p className="text-[10px] tracking-widest uppercase opacity-40 mb-1">{activeDash.name}</p>
            <p className="serif text-[2.4rem] leading-none mb-1">
              <span className="text-[1rem] opacity-40 mr-1">{data.currency}</span>
              {totalContributions.toLocaleString()}
            </p>
            <p className="text-[10px] opacity-40 mb-3">Total contributions</p>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between text-[10px] opacity-50 mb-1.5">
                <span>Pool spent</span>
                <span>{Math.round(spentPct)}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${spentPct}%`,
                    background: spentPct > 85 ? '#FF8A80' : spentPct > 60 ? '#FFD740' : '#69F0AE',
                  }}
                />
              </div>
              <p className="text-[10px] opacity-40 mt-1.5">
                {fmt(totalSharedExpenses)} spent · {fmt(availableBalance)} remaining
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-white/[.08] rounded-lg p-3">
                <p className="text-[10px] tracking-wider uppercase opacity-50 mb-0.5">Members</p>
                <p className="font-semibold text-[16px]">{activeDash.members?.length || 0}</p>
              </div>
              <div className="bg-white/[.08] rounded-lg p-3">
                <p className="text-[10px] tracking-wider uppercase opacity-50 mb-0.5">Your share</p>
                <p className="font-semibold text-[13px] text-[#69F0AE]">{fmt(myTotal)}</p>
              </div>
              <div className="bg-white/[.08] rounded-lg p-3">
                <p className="text-[10px] tracking-wider uppercase opacity-50 mb-0.5">Available</p>
                <p className={`font-semibold text-[13px] ${availableBalance < 0 ? 'text-[#FF8A80]' : 'text-[#69F0AE]'}`}>
                  {fmt(availableBalance)}
                </p>
              </div>
            </div>

            {/* Per-member breakdown */}
            {Object.values(memberTotals).length > 0 && (
              <div className="space-y-2">
                {Object.values(memberTotals).map(m => (
                  <div key={m.uid} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar photoURL={m.photoURL} name={m.name} size={6} />
                      <span className="text-[13px] opacity-75">{m.name}</span>
                      {m.uid === user?.uid && <span className="text-[10px] opacity-40">you</span>}
                    </div>
                    <span className="text-[13px] font-medium">{fmt(m.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <BtnPrimary onClick={() => setModal('contribute')}>+ Contribute</BtnPrimary>
            <BtnOutline className="justify-center" onClick={() => setModal('expense')}>+ Add expense</BtnOutline>
          </div>

          {/* Transaction history */}
          <Card>
            <CardTitle>Transaction history</CardTitle>
            <div className="flex gap-2 mb-4">
              <select
                value={txTypeFilter}
                onChange={e => setTxTypeFilter(e.target.value)}
                className="flex-1 text-[12px] px-2 py-1.5 border border-[#E3DECE] rounded-lg bg-white text-[#6B6458] focus:outline-none"
              >
                <option value="">All types</option>
                <option value="contribution">Contributions</option>
                <option value="expense">Expenses</option>
              </select>
              <select
                value={txPeriod}
                onChange={e => setTxPeriod(e.target.value)}
                className="flex-1 text-[12px] px-2 py-1.5 border border-[#E3DECE] rounded-lg bg-white text-[#6B6458] focus:outline-none"
              >
                <option value="">All time</option>
                <option value="month">This month</option>
                <option value="lastMonth">Last month</option>
                <option value="3months">Last 3 months</option>
              </select>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {allTransactions.length ? allTransactions.map(tx => {
                const isExpense = tx.txType === 'expense'
                const allocOpt  = !isExpense && ALLOC_OPTIONS.find(a => a.key === tx.allocation)
                return (
                  <div key={tx.id} className="flex items-center gap-2.5 py-2.5 border-b border-[#F0EDE6] last:border-0">
                    <Avatar photoURL={tx.photoURL} name={tx.name} size={7} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[12px] font-medium">{tx.name}</span>
                        {isExpense && tx.category && <CatPill cat={tx.category} />}
                        {!isExpense && allocOpt && (
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ background: allocOpt.color + '22', color: allocOpt.color }}
                          >
                            {allocOpt.label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {tx.note && <span className="text-[11px] text-[#9C948A] truncate">{tx.note}</span>}
                        <span className="text-[10px] text-[#BFBAB3] flex-shrink-0">{tx.date}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-semibold text-[13px] ${isExpense ? 'text-[#C0392B]' : 'text-[#1A7A4A]'}`}>
                        {isExpense ? '−' : '+'}{fmt(tx.amount)}
                      </p>
                      <p className="text-[10px] text-[#9C948A]">{isExpense ? 'expense' : 'contrib.'}</p>
                    </div>
                  </div>
                )
              }) : <Empty icon="📋" text="No transactions yet" />}
            </div>
          </Card>

          {/* Members & Invite */}
          <Card>
            <CardTitle>Members</CardTitle>
            <div className="space-y-1 mb-5">
              {activeDash.members?.map(m => (
                <div key={m.uid} className="flex items-center gap-3 py-2.5">
                  <Avatar photoURL={m.photoURL} name={m.name} size={8} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium truncate">{m.name}</p>
                    <p className="text-[11px] text-[#9C948A]">
                      {m.uid === user?.uid ? 'You' : ''}
                      {m.uid === activeDash.createdBy ? (m.uid === user?.uid ? ' · Admin' : 'Admin') : ''}
                    </p>
                  </div>
                  <p className="text-[13px] text-[#6B6458] font-medium">{fmt(memberTotals[m.uid]?.total || 0)}</p>
                </div>
              ))}
            </div>

            {/* Invite code */}
            <div className="bg-[#F7F5F0] rounded-xl p-4 mb-4">
              <p className="text-[10px] tracking-widest uppercase text-[#9C948A] mb-2 font-medium">Invite code</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[20px] font-mono font-bold text-[#1A1814] bg-white border border-[#E3DECE] rounded-lg px-3 py-2 tracking-[0.2em] text-center">
                  {activeDash.shortCode || activeDash.id}
                </code>
                <button
                  onClick={copyCode}
                  className={`text-[12px] font-semibold whitespace-nowrap px-3 py-2 rounded-lg transition-colors ${
                    copied ? 'bg-[#E8F5EE] text-[#1A7A4A]' : 'bg-[#EEF2FD] text-[#2B5CE6] hover:bg-[#dde8fb]'
                  }`}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-[11px] text-[#9C948A] mt-2">Share this 6-character code so others can join.</p>
            </div>

            <BtnOutline
              className="w-full justify-center"
              style={{ color: '#C0392B', borderColor: '#FBCDC8' }}
              onClick={() => { if (confirm('Leave this dashboard?')) leaveDashboard(activeDash.id) }}
            >
              Leave dashboard
            </BtnOutline>
          </Card>
        </>
      )}

      {/* Create modal */}
      {modal === 'create' && (
        <Modal title="Create shared dashboard" onClose={() => { setModal(null); setCreateName('') }}>
          <p className="text-[13px] text-[#6B6458] mb-4">
            Give your dashboard a name. A short 6-character invite code will be generated for others to join.
          </p>
          <Field label="Dashboard name">
            <Input placeholder="e.g. Household, Couple, Roommates" value={createName} onChange={e => setCreateName(e.target.value)} autoFocus />
          </Field>
          <BtnPrimary onClick={handleCreate} disabled={loading}>{loading ? 'Creating…' : 'Create dashboard'}</BtnPrimary>
        </Modal>
      )}

      {/* Join modal */}
      {modal === 'join' && (
        <Modal title="Join a dashboard" onClose={() => { setModal(null); setJoinCode(''); setJoinError('') }}>
          <p className="text-[13px] text-[#6B6458] mb-4">
            Enter the 6-character invite code shared by the dashboard creator.
          </p>
          <Field label="Invite code">
            <Input
              placeholder="e.g. AB3K7P"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              autoFocus
              style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'monospace', fontSize: '16px' }}
            />
          </Field>
          {joinError && <p className="text-[12px] text-[#C0392B] mb-3">⚠ {joinError}</p>}
          <BtnPrimary onClick={handleJoin} disabled={loading}>{loading ? 'Joining…' : 'Join dashboard'}</BtnPrimary>
        </Modal>
      )}

      {/* Contribute modal */}
      {modal === 'contribute' && activeDash && (
        <Modal
          title={`Contribute to ${activeDash.name}`}
          onClose={() => { setModal(null); setContribForm({ amount: '', note: '', allocation: 'needs' }) }}
        >
          <p className="text-[13px] text-[#6B6458] mb-4">
            This amount will be added to the shared pool and deducted from your personal balance.
          </p>
          <div className="mb-4">
            <label className="block text-[12px] font-medium text-[#6B6458] mb-2">Deduct from</label>
            <div className="flex gap-2">
              {ALLOC_OPTIONS.map(({ key, label, color }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setContribForm(f => ({ ...f, allocation: key }))}
                  className="flex-1 py-2.5 rounded-lg border-2 text-[12px] font-medium transition-all"
                  style={
                    contribForm.allocation === key
                      ? { background: color, borderColor: color, color: '#fff' }
                      : { background: '#fff', borderColor: '#E3DECE', color: '#6B6458' }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <Field label="Amount">
            <Input type="number" placeholder="0.00" value={contribForm.amount} onChange={e => setContribForm(f => ({ ...f, amount: e.target.value }))} autoFocus />
          </Field>
          <Field label="Note (optional)">
            <Input placeholder="What's this for?" value={contribForm.note} onChange={e => setContribForm(f => ({ ...f, note: e.target.value }))} />
          </Field>
          <BtnPrimary onClick={handleContribute}>Confirm contribution</BtnPrimary>
        </Modal>
      )}

      {/* Add shared expense modal */}
      {modal === 'expense' && activeDash && (
        <Modal
          title={`Add expense — ${activeDash.name}`}
          onClose={() => { setModal(null); setExpenseForm({ amount: '', category: 'food', note: '', date: today() }) }}
        >
          <p className="text-[13px] text-[#6B6458] mb-4">
            Log a group expense from the shared pool. This deducts from the shared balance only.
          </p>
          <Field label="Amount">
            <Input type="number" placeholder="0.00" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <Select value={expenseForm.category} onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value }))}>
                {CATS.map(c => <option key={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Date">
              <Input type="date" value={expenseForm.date} onChange={e => setExpenseForm(f => ({ ...f, date: e.target.value }))} />
            </Field>
          </div>
          <Field label="Note (optional)">
            <Input placeholder="What was this for?" value={expenseForm.note} onChange={e => setExpenseForm(f => ({ ...f, note: e.target.value }))} />
          </Field>
          <BtnPrimary onClick={handleAddSharedExpense}>Log expense</BtnPrimary>
        </Modal>
      )}
    </div>
  )
}
