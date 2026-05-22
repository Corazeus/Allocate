import React, { useState } from 'react'
import { Card, CardTitle, Modal, Field, Input, BtnPrimary, BtnOutline, Empty } from '../components/ui'

export default function Shared({ data, save, fmt }) {
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name: '', email: '' })

  const totalIncome = data.earnings.reduce((s, e) => s + e.amount, 0)
  const totalSpent  = data.expenses.reduce((s, e) => s + e.amount, 0)

  function addUser() {
    if (!form.name.trim()) return
    save({ sharedUsers: [...(data.sharedUsers || []), { id: Date.now(), ...form }] })
    setModal(false)
    setForm({ name: '', email: '' })
  }

  function removeUser(id) {
    save({ sharedUsers: data.sharedUsers.filter(u => u.id !== id) })
  }

  return (
    <div className="fade-in">
      <Card>
        <CardTitle>Shared dashboard</CardTitle>
        <div className="border-2 border-dashed border-[#E3DECE] rounded-xl p-6 text-center mb-4">
          <p className="text-3xl mb-2">🔗</p>
          <p className="text-[13px] text-[#9C948A] mb-4 leading-relaxed">
            Invite a partner, housemate, or spouse to share<br />a combined view of income and expenses.
          </p>
          <BtnPrimary className="w-auto px-5 py-2 text-[13px]" onClick={() => setModal(true)}
            style={{ display: 'inline-block', width: 'auto' }}>
            Invite someone
          </BtnPrimary>
        </div>

        {(data.sharedUsers || []).length ? (
          <div className="space-y-2">
            {data.sharedUsers.map(u => (
              <div key={u.id} className="flex items-center justify-between bg-[#F7F5F0] rounded-lg px-4 py-3">
                <div>
                  <p className="text-[14px] font-medium">{u.name}</p>
                  {u.email && <p className="text-[12px] text-[#9C948A]">{u.email}</p>}
                </div>
                <BtnOutline onClick={() => removeUser(u.id)} className="text-[12px] py-1 px-3">Remove</BtnOutline>
              </div>
            ))}
          </div>
        ) : null}
      </Card>

      {(data.sharedUsers || []).length > 0 && (
        <Card>
          <CardTitle>Combined overview</CardTitle>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-[#F7F5F0] rounded-lg p-4">
              <p className="text-[10px] tracking-widest uppercase text-[#9C948A] mb-1">Your income</p>
              <p className="text-[1.1rem] font-semibold text-[#1A7A4A]">{fmt(totalIncome)}</p>
            </div>
            <div className="bg-[#F7F5F0] rounded-lg p-4">
              <p className="text-[10px] tracking-widest uppercase text-[#9C948A] mb-1">Your spent</p>
              <p className="text-[1.1rem] font-semibold text-[#C0392B]">{fmt(totalSpent)}</p>
            </div>
          </div>
          <div className="bg-[#EEF2FD] rounded-lg px-4 py-3">
            <p className="text-[12px] text-[#2B5CE6] leading-relaxed">
              <strong>Real-time sync</strong> — once your partner signs in with the same Firestore project, their data will appear here automatically. Both users share a live combined view.
            </p>
          </div>
        </Card>
      )}

      <Card>
        <CardTitle>How shared mode works</CardTitle>
        <div className="space-y-3">
          {[
            { step: '1', text: 'Invite your partner by adding their name above' },
            { step: '2', text: 'Share the app link — they sign in with their Google account' },
            { step: '3', text: 'Both of you enter your own earnings and expenses' },
            { step: '4', text: 'The combined dashboard updates in real time for both of you' },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#2B5CE6] text-white text-[11px] font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">{step}</div>
              <p className="text-[13px] text-[#6B6458] leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </Card>

      {modal && (
        <Modal title="Invite to shared dashboard" onClose={() => setModal(false)}>
          <p className="text-[13px] text-[#6B6458] mb-4">Add their name so you remember who you've invited.</p>
          <Field label="Name">
            <Input placeholder="e.g. Partner, Roommate" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus />
          </Field>
          <Field label="Email (optional)">
            <Input type="email" placeholder="their@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </Field>
          <BtnPrimary onClick={addUser}>Add to shared dashboard</BtnPrimary>
        </Modal>
      )}
    </div>
  )
}
