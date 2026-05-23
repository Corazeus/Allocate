import { useState, useEffect, useCallback } from 'react'
import { doc, setDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

const DEFAULT_STATE = {
  currency: '₱',
  allocation: { needs: 50, wants: 30, savings: 20 },
  earnings: [],
  expenses: [],
  presets: [
    { id: 1, name: 'Bus fare',  amount: 50,  category: 'transport' },
    { id: 2, name: 'Coffee',    amount: 80,  category: 'food' },
    { id: 3, name: 'Lunch',     amount: 180, category: 'food' },
    { id: 4, name: 'Grab',      amount: 150, category: 'transport' },
    { id: 5, name: 'Groceries', amount: 500, category: 'food' },
  ],
  sharedUsers: [],
  sharedDashboardIds: [],
}

export function useStore(user) {
  const [data, setData] = useState(DEFAULT_STATE)
  const [syncing, setSyncing] = useState(false)

  // Subscribe to Firestore when user is present
  useEffect(() => {
    if (!user) {
      setData(DEFAULT_STATE)
      return
    }
    const ref = doc(db, 'users', user.uid)
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setData(prev => ({ ...DEFAULT_STATE, ...prev, ...snap.data() }))
      }
    })
    return unsub
  }, [user])

  const save = useCallback(async (updates) => {
    const next = { ...data, ...updates }
    setData(next)
    if (!user) return
    setSyncing(true)
    try {
      await setDoc(doc(db, 'users', user.uid), next, { merge: true })
    } finally {
      setSyncing(false)
    }
  }, [data, user])

  return { data, save, syncing }
}
