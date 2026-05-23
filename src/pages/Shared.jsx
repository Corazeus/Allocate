import React, { useState } from 'react'
import { Card, CardTitle, Modal, Field, Input, BtnPrimary, BtnOutline, Empty } from '../components/ui'
import { useShared } from '../hooks/useShared'

const ALLOC_OPTIONS = [
  { key: 'needs',   label: 'Needs',   color: '#2B5CE6' },
  { key: 'wants',   label: 'Wants',   color: '#1A7A4A' },
  { key: 'savings', label: 'Savings', color: '#7C3AED' },
]

function Avatar({ photoURL, name, size = 8 }) {
  const cls = `w-${size} h-${size} rounded-full flex-shrink-0`
  if (photoURL) return <img src={photoURL} className={cls} alt="" />
  return (
    <div className={`${cls} bg-[#F0EDE6] border border-[#E3DECE] flex items-center justify-center font-semibold text-[#6B6458]`}
      style={{ fontSize: size * 1.4 + 'px' }}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

export default function Shared({ data, save, fmt, user }) {
  const { dashboards, loading, createDashboard, joinDashboard, addContribution, leaveDashboard } =
    useShared(user, data.sharedDashboardIds, save)

  const [activeId, setActiveId]         = useState(null)
  const [modal, setModal]               = useState(null) // 'create' | 'join' | 'contribute'
  const [createName, setCreateName]     = useState('')
  const [joinCode, setJoinCode]         = useState('')
  const [joinError, setJoinError]       = useState('')
  const [contribForm, setContribForm]   = useState({ amount: '', note: '', allocation: 'needs' })
  const [copied, setCopied]             = useState(false)

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
      setActiveId(joinCode.trim())
      setModal(null)
      setJoinCode('')
    }
  }

  async function handleContribute() {
    const amount = parseFloat(contribForm.amount)
    if (!amount || isNaN(amount) || !activeDash) return

    await addContribution(activeDash.id, {
      amount,
      note: contribForm.note,
      allocation: contribForm.allocation,
    })

    // Deduct from user's own expenses
    const exp = {
      id: Date.now(),
      amount,
      category: 'other',
      allocation: contribForm.allocation,
      date: new Date().toISOString().split('T')[0],
      note: `Shared: ${activeDash.name}`,
      isSharedContribution: true,
      dashboardId: activeDash.id,
    }
    save({ expenses: [...data.expenses, exp] })
    setModal(null)
    setContribForm({ amount: '', note: '', allocation: 'needs' })
  }

  function copyCode(id) {
    navigator.clipboard?.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  // Per-member contribution totals for active dashboard
  const memberTotals = {}
  activeDash?.members?.forEach(m => {
    memberTotals[m.uid] = { ...m, total: 0 }
  })
  activeDash?.contributions?.forEach(c => {
    if (memberTotals[c.uid]) memberTotals[c.uid].total += c.amount
    else memberTotals[c.uid] = { uid: c.uid, name: c.name, photoURL: c.photoURL, total: c.amount }
  })
  const totalContributions = Object.values(memberTotals).reduce((s, m) => s + m.total, 0)
  const myTotal = memberTotals[user?.uid]?.total || 0

  const recentContribs = [...(activeDash?.contributions || [])]
    .sort((a, b) => b.id - a.id)
    .slice(0, 15)

  // ── Landing page ───────────────────────────────────────────────────
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
              Give your dashboard a name. Share the invite code with others to let them join.
            </p>
            <Field label="Dashboard name">
              <Input
                placeholder="e.g. Household, Couple, Roommates"
                value={createName}
                onChange={e => setCreateName(e.target.value)}
                autoFocus
              />
            </Field>
            <BtnPrimary onClick={handleCreate} disabled={loading}>
              {loading ? 'Creating…' : 'Create dashboard'}
            </BtnPrimary>
          </Modal>
        )}

        {modal === 'join' && (
          <Modal title="Join a dashboard" onClose={() => { setModal(null); setJoinCode(''); setJoinError('') }}>
            <p className="text-[13px] text-[#6B6458] mb-4">
              Enter the invite code shared with you by the dashboard creator.
            </p>
            <Field label="Invite code">
              <Input
                placeholder="Paste code here"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                autoFocus
              />
            </Field>
            {joinError && <p className="text-[12px] text-[#C0392B] mb-3">⚠ {joinError}</p>}
            <BtnPrimary onClick={handleJoin} disabled={loading}>
              {loading ? 'Joining…' : 'Join dashboard'}
            </BtnPrimary>
          </Modal>
        )}
      </div>
    )
  }

  // ── Dashboard view ─────────────────────────────────────────────────
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
            <p className="serif text-[2.4rem] leading-none mb-4">
              <span className="text-[1rem] opacity-40 mr-1">{data.currency}</span>
              {totalContributions.toLocaleString()}
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/[.08] rounded-lg p-3">
                <p className="text-[10px] tracking-wider uppercase opacity-50 mb-0.5">Members</p>
                <p className="font-semibold text-[16px]">{activeDash.members?.length || 0}</p>
              </div>
              <div className="bg-white/[.08] rounded-lg p-3">
                <p className="text-[10px] tracking-wider uppercase opacity-50 mb-0.5">Your share</p>
                <p className="font-semibold text-[#69F0AE]">{fmt(myTotal)}</p>
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
                      {m.uid === user?.uid && (
                        <span className="text-[10px] opacity-40">you</span>
                      )}
                    </div>
                    <span className="text-[13px] font-medium">{fmt(m.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contribute button */}
          <BtnPrimary className="mb-4" onClick={() => setModal('contribute')}>
            + Add contribution
          </BtnPrimary>

          {/* Recent contributions */}
          <Card>
            <CardTitle>Recent contributions</CardTitle>
            {recentContribs.length ? recentContribs.map(c => {
              const allocOpt = ALLOC_OPTIONS.find(a => a.key === c.allocation)
              return (
                <div key={c.id} className="flex items-center justify-between py-3 border-b border-[#F0EDE6] last:border-0">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Avatar photoURL={c.photoURL} name={c.name} size={5} />
                      <span className="text-[13px] font-medium">{c.name}</span>
                      {allocOpt && (
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: allocOpt.color + '22', color: allocOpt.color }}
                        >
                          {allocOpt.label}
                        </span>
                      )}
                      {c.note && <span className="text-[12px] text-[#9C948A]">· {c.note}</span>}
                    </div>
                    <p className="text-[11px] text-[#9C948A] mt-0.5 ml-7">{c.date}</p>
                  </div>
                  <p className="font-semibold text-[15px]">{fmt(c.amount)}</p>
                </div>
              )
            }) : <Empty icon="💸" text="No contributions yet" />}
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
                <code className="flex-1 text-[12px] font-mono text-[#1A1814] bg-white border border-[#E3DECE] rounded-lg px-3 py-2 break-all leading-relaxed">
                  {activeDash.id}
                </code>
                <button
                  onClick={() => copyCode(activeDash.id)}
                  className={`text-[12px] font-semibold whitespace-nowrap px-3 py-2 rounded-lg transition-colors ${
                    copied ? 'bg-[#E8F5EE] text-[#1A7A4A]' : 'bg-[#EEF2FD] text-[#2B5CE6] hover:bg-[#dde8fb]'
                  }`}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-[11px] text-[#9C948A] mt-2">Share this code so others can join.</p>
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

      {/* Create modal (from "New" tab button) */}
      {modal === 'create' && (
        <Modal title="Create shared dashboard" onClose={() => { setModal(null); setCreateName('') }}>
          <p className="text-[13px] text-[#6B6458] mb-4">
            Give your dashboard a name. Share the invite code with others to let them join.
          </p>
          <Field label="Dashboard name">
            <Input
              placeholder="e.g. Household, Couple, Roommates"
              value={createName}
              onChange={e => setCreateName(e.target.value)}
              autoFocus
            />
          </Field>
          <BtnPrimary onClick={handleCreate} disabled={loading}>
            {loading ? 'Creating…' : 'Create dashboard'}
          </BtnPrimary>
        </Modal>
      )}

      {/* Join modal */}
      {modal === 'join' && (
        <Modal title="Join a dashboard" onClose={() => { setModal(null); setJoinCode(''); setJoinError('') }}>
          <p className="text-[13px] text-[#6B6458] mb-4">
            Enter the invite code shared with you by the dashboard creator.
          </p>
          <Field label="Invite code">
            <Input
              placeholder="Paste code here"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              autoFocus
            />
          </Field>
          {joinError && <p className="text-[12px] text-[#C0392B] mb-3">⚠ {joinError}</p>}
          <BtnPrimary onClick={handleJoin} disabled={loading}>
            {loading ? 'Joining…' : 'Join dashboard'}
          </BtnPrimary>
        </Modal>
      )}

      {/* Contribute modal */}
      {modal === 'contribute' && activeDash && (
        <Modal title={`Contribute to ${activeDash.name}`} onClose={() => { setModal(null); setContribForm({ amount: '', note: '', allocation: 'needs' }) }}>
          <p className="text-[13px] text-[#6B6458] mb-4">
            This amount will appear in the shared dashboard and be deducted from your personal balance.
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
            <Input
              type="number" placeholder="0.00"
              value={contribForm.amount}
              onChange={e => setContribForm(f => ({ ...f, amount: e.target.value }))}
              autoFocus
            />
          </Field>
          <Field label="Note (optional)">
            <Input
              placeholder="What's this for?"
              value={contribForm.note}
              onChange={e => setContribForm(f => ({ ...f, note: e.target.value }))}
            />
          </Field>
          <BtnPrimary onClick={handleContribute}>Confirm contribution</BtnPrimary>
        </Modal>
      )}
    </div>
  )
}
