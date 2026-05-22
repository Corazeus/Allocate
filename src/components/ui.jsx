import React, { useEffect } from 'react'

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white border border-[#E3DECE] rounded-xl p-5 mb-4 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children }) {
  return (
    <p className="text-[11px] font-medium tracking-widest uppercase text-[#9C948A] mb-4">
      {children}
    </p>
  )
}

export function Field({ label, children }) {
  return (
    <div className="mb-3">
      <label className="block text-[12px] font-medium text-[#6B6458] mb-1">{label}</label>
      {children}
    </div>
  )
}

export function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full px-3 py-2.5 border border-[#E3DECE] rounded-lg bg-white text-[#1A1814] text-[14px] focus:outline-none focus:border-[#2B5CE6] transition-colors ${className}`}
      {...props}
    />
  )
}

export function Select({ className = '', children, ...props }) {
  return (
    <select
      className={`w-full px-3 py-2.5 border border-[#E3DECE] rounded-lg bg-white text-[#1A1814] text-[14px] focus:outline-none focus:border-[#2B5CE6] transition-colors ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

export function BtnPrimary({ children, className = '', ...props }) {
  return (
    <button
      className={`w-full py-3 bg-[#2B5CE6] hover:bg-[#244dd4] text-white rounded-lg font-medium text-[14px] transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function BtnOutline({ children, className = '', ...props }) {
  return (
    <button
      className={`py-2 px-4 border border-[#E3DECE] rounded-lg text-[#1A1814] font-medium text-[13px] hover:bg-[#F0EDE6] transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Modal({ id, title, children, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-black/35 z-50 flex items-end justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-t-2xl p-6 w-full max-w-lg slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="serif text-[1.25rem] text-[#1A1814]">{title}</h2>
          <button onClick={onClose} className="text-[#9C948A] text-2xl leading-none hover:text-[#1A1814]">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Empty({ icon, text }) {
  return (
    <div className="text-center py-10 text-[#9C948A]">
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-[13px]">{text}</p>
    </div>
  )
}

export function CatPill({ cat }) {
  const styles = {
    food:          'bg-[#FEF3E2] text-[#B45309]',
    transport:     'bg-[#EEF2FD] text-[#2B5CE6]',
    entertainment: 'bg-[#F5F0FF] text-[#7C3AED]',
    utilities:     'bg-[#E8F5EE] text-[#1A7A4A]',
    health:        'bg-[#FDF0EF] text-[#C0392B]',
    shopping:      'bg-[#FFF7ED] text-[#D97706]',
    other:         'bg-[#F0EDE6] text-[#6B6458]',
  }
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full tracking-wide ${styles[cat] || styles.other}`}>
      {cat}
    </span>
  )
}
