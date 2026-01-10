'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getFirebaseAuth } from '@/lib/firebaseClient'

const ADMIN_EMAIL = 'careermindai28@gmail.com'

export default function AdminPage() {
  const router = useRouter()
  const auth = useMemo(() => getFirebaseAuth(), [])
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.replace('/sign-in?next=/admin')
        return
      }
      const userEmail = (user.email || '').toLowerCase()
      if (userEmail !== ADMIN_EMAIL) {
        router.replace('/user-dashboard')
      }
    })
    return () => unsub()
  }, [auth, router])

  const togglePlan = async (plan: 'FREE' | 'PAID') => {
    try {
      setStatus('Updating...')
      const user = auth.currentUser
      if (!user) throw new Error('Not signed in')
      const token = await user.getIdToken()

      const res = await fetch('/api/admin/set-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: email.trim().toLowerCase(), plan }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Admin action failed')

      setStatus(`User set to ${plan}`)
    } catch (e: any) {
      setStatus(e?.message || 'Something went wrong')
    }
  }

  return (
    <div className="max-w-xl mx-auto py-10 space-y-4">
      <h1 className="text-2xl font-bold">Admin – User Plan Control</h1>

      <div className="text-sm text-text-secondary">
        Admin email: <span className="font-medium">{ADMIN_EMAIL}</span>
      </div>

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="User email"
        className="w-full p-3 border rounded"
      />

      <div className="flex gap-4">
        <button onClick={() => togglePlan('FREE')} className="px-4 py-2 border rounded">
          Set FREE
        </button>
        <button onClick={() => togglePlan('PAID')} className="px-4 py-2 bg-primary text-white rounded">
          Set PAID
        </button>
      </div>

      {status ? <div className="text-sm">{status}</div> : null}
    </div>
  )
}
