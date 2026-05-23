import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, updateDoc, onSnapshot, collection, addDoc, arrayUnion, arrayRemove, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

function generateShortCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export function useShared(user, sharedDashboardIds, save) {
  const [dashboards, setDashboards] = useState([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  const idsKey = JSON.stringify(sharedDashboardIds)

  useEffect(() => {
    if (!user || !sharedDashboardIds?.length) {
      setDashboards([])
      setInitialLoading(false)
      return
    }

    setInitialLoading(true)
    let received = 0
    const total = sharedDashboardIds.length

    const unsubs = sharedDashboardIds.map(id =>
      onSnapshot(doc(db, 'sharedDashboards', id), snap => {
        if (snap.exists()) {
          const d = { id: snap.id, ...snap.data() }
          setDashboards(prev => {
            const filtered = prev.filter(x => x.id !== id)
            return [...filtered, d].sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))
          })
        }
        received++
        if (received >= total) setInitialLoading(false)
      })
    )
    return () => unsubs.forEach(u => u())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, idsKey])

  const createDashboard = useCallback(async (name) => {
    if (!user) return null
    setLoading(true)
    try {
      const shortCode = generateShortCode()
      const ref = await addDoc(collection(db, 'sharedDashboards'), {
        name,
        shortCode,
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
        members: [{ uid: user.uid, name: user.displayName || 'You', photoURL: user.photoURL || null }],
        contributions: [],
        sharedExpenses: [],
      })
      await save({ sharedDashboardIds: [...(sharedDashboardIds || []), ref.id] })
      return ref.id
    } finally {
      setLoading(false)
    }
  }, [user, sharedDashboardIds, save])

  const joinDashboard = useCallback(async (code) => {
    if (!user) return { error: 'Not logged in.' }
    const input = code.trim()
    if (!input) return { error: 'Enter an invite code.' }
    setLoading(true)
    try {
      let docId = null
      let dashData = null

      // Try as shortCode first (≤8 chars)
      if (input.length <= 8) {
        const q = query(collection(db, 'sharedDashboards'), where('shortCode', '==', input.toUpperCase()))
        const snap = await getDocs(q)
        if (!snap.empty) {
          docId = snap.docs[0].id
          dashData = snap.docs[0].data()
        }
      }

      // Fallback: treat as full document ID
      if (!docId) {
        const ref = doc(db, 'sharedDashboards', input)
        const snap = await getDoc(ref)
        if (!snap.exists()) return { error: 'Dashboard not found. Check the invite code.' }
        docId = input
        dashData = snap.data()
      }

      if ((sharedDashboardIds || []).includes(docId)) return { error: 'You are already a member of this dashboard.' }

      const alreadyMember = dashData.members?.some(m => m.uid === user.uid)
      if (!alreadyMember) {
        await updateDoc(doc(db, 'sharedDashboards', docId), {
          members: arrayUnion({ uid: user.uid, name: user.displayName || 'User', photoURL: user.photoURL || null }),
        })
      }
      await save({ sharedDashboardIds: [...(sharedDashboardIds || []), docId] })
      return { success: true, name: dashData.name, docId }
    } catch (e) {
      return { error: e.message || 'Something went wrong.' }
    } finally {
      setLoading(false)
    }
  }, [user, sharedDashboardIds, save])

  const addContribution = useCallback(async (dashboardId, { amount, note, allocation }) => {
    if (!user) return null
    const contribution = {
      id: Date.now(),
      uid: user.uid,
      name: user.displayName || 'User',
      photoURL: user.photoURL || null,
      amount: parseFloat(amount),
      note: note || '',
      allocation: allocation || 'needs',
      date: new Date().toISOString().split('T')[0],
    }
    await updateDoc(doc(db, 'sharedDashboards', dashboardId), { contributions: arrayUnion(contribution) })
    return contribution
  }, [user])

  const addSharedExpense = useCallback(async (dashboardId, { amount, category, note, date }) => {
    if (!user) return null
    const expense = {
      id: Date.now(),
      uid: user.uid,
      name: user.displayName || 'User',
      photoURL: user.photoURL || null,
      amount: parseFloat(amount),
      category: category || 'other',
      note: note || '',
      date: date || new Date().toISOString().split('T')[0],
    }
    await updateDoc(doc(db, 'sharedDashboards', dashboardId), { sharedExpenses: arrayUnion(expense) })
    return expense
  }, [user])

  const leaveDashboard = useCallback(async (dashboardId) => {
    if (!user) return
    const ref = doc(db, 'sharedDashboards', dashboardId)
    const snap = await getDoc(ref)
    if (snap.exists()) {
      const member = snap.data().members?.find(m => m.uid === user.uid)
      if (member) await updateDoc(ref, { members: arrayRemove(member) })
    }
    setDashboards(prev => prev.filter(d => d.id !== dashboardId))
    await save({ sharedDashboardIds: (sharedDashboardIds || []).filter(id => id !== dashboardId) })
  }, [user, sharedDashboardIds, save])

  return { dashboards, loading, initialLoading, createDashboard, joinDashboard, addContribution, addSharedExpense, leaveDashboard }
}
