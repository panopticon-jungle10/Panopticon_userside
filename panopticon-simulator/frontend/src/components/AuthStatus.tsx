'use client'

import { useEffect, useState } from 'react'
import { clearStoredUser, getStoredUser, type StoredUser } from '@/lib/auth'

export default function AuthStatus() {
  const [user, setUser] = useState<StoredUser | null>(null)

  useEffect(() => {
    setUser(getStoredUser())

    function handleChange() {
      setUser(getStoredUser())
    }

    window.addEventListener('panopticon-user-change', handleChange)
    return () => {
      window.removeEventListener('panopticon-user-change', handleChange)
    }
  }, [])

  if (!user) {
    return (
      <span style={{ color: '#777', fontSize: '13px' }}>
        Not signed in
      </span>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ color: '#60a5fa', fontSize: '13px' }}>
        {user.email}
      </span>
      <button
        type="button"
        onClick={() => clearStoredUser()}
        style={{
          padding: '4px 10px',
          fontSize: '12px',
          background: 'transparent',
          border: '1px solid #333',
          borderRadius: '4px',
          color: '#ccc',
          cursor: 'pointer',
        }}
      >
        Logout
      </button>
    </div>
  )
}
