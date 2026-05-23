import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, updateDoc, onSnapshot, collection, addDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '../firebase'

export function useShared(user, sharedDashboardIds, save) {
  const [dashboards, setDashboards] = useState([])
  const [loading, setLoading] = useState(false)

  const idsKey = JSON.stringify(sharedDashboardIds)

  useEffect(() => {
    if (!user || !sharedDashboardIds?.length) {
      setDashboards([])
      return
    }
    const unsubs = sharedDashboardIds.map(id => {
      return onSnapshot(doc(db, 'sharedDashboards', id), snap => {
        if (snap.exists()) {
          const d = { id: snap.id, ...snap.data() }
          setDashboards(prev => {
            const filtered = prev.filter(x => x.id !== id)
            return [...filtered, d].sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))
          })
        }
      })
    })
    return () => unsubs.forEach(u => u())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, idsKey])

  const createDashboard = useCallback(async (name) => {
    if (!user) return null
    setLoading(true)
    try {
      const ref = await addDoc(collection(db, 'sharedDashboards'), {
        name,
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
        members: [{ uid: user.uid, name: user.displayName || 'You', photoURL: user.photoURL || null }],
        contributions: [],
      })
      await save({ sharedDashboardIds: [...(sharedDashboardIds || []), ref.id] })
      return ref.id
    } finally {
      setLoading(false)
    }
  }, [user, sharedDashboardIds, save])

  const joinDashboard = useCallback(async (code) => {
    if (!user) return { error: 'Not logged in.' }
    const id = code.trim()
    if (!id) return { error: 'Enter an invite code.' }
    if ((sharedDashboardIds || []).includes(id)) return { error: 'You are already a member of this dashboard.' }
    setLoading(true)
    try {
      const ref = doc(db, 'sharedDashboards', id)
      const snap = await getDoc(ref)
      if (!snap.exists()) return { error: 'Dashboard not found. Check the invite code.' }
      const dashData = snap.data()
      const alreadyMember = dashData.members?.some(m => m.uid === user.uid)
      if (!alreadyMember) {
        await updateDoc(ref, {
          members: arrayUnion({ uid: user.uid, name: user.displayName || 'User', photoURL: user.photoURL || null }),
        })
      }
      await save({ sharedDashboardIds: [...(sharedDashboardIds || []), id] })
      return { success: true, name: dashData.name }
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
    const ref = doc(db, 'sharedDashboards', dashboardId)
    await updateDoc(ref, { contributions: arrayUnion(contribution) })
    return contribution
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

  return { dashboards, loading, createDashboard, joinDashboard, addContribution, leaveDashboard }
}
