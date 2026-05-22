import { useState, useEffect } from 'react'
import { doc, setDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

// Creates a shared room between two users
export function useShared(user, sharedUsers) {
  const [partnerData, setPartnerData] = useState([])

  useEffect(() => {
    if (!user || !sharedUsers?.length) {
      setPartnerData([])
      return
    }

    // Listen to each shared user's public data
    const unsubs = sharedUsers.map(su => {
      if (!su.uid) return null
      return onSnapshot(doc(db, 'users', su.uid), snap => {
        if (snap.exists()) {
          setPartnerData(prev => {
            const filtered = prev.filter(p => p.uid !== su.uid)
            return [...filtered, { uid: su.uid, name: su.name, ...snap.data() }]
          })
        }
      })
    }).filter(Boolean)

    return () => unsubs.forEach(u => u())
  }, [user, sharedUsers])

  return { partnerData }
}
