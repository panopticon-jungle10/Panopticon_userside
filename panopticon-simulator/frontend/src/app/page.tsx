'use client'

import { useEffect, useState } from 'react'
import {
  getProducts,
  getUsers,
  loginOrCreate,
  type Product,
  type User,
} from '@/lib/api'
import { getStoredUser, setStoredUser, type StoredUser } from '@/lib/auth'

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsData, usersData] = await Promise.all([
          getProducts(),
          getUsers(),
        ])
        setProducts(productsData.slice(0, 3)) // Show only 3 products
        setUsers(usersData)
        const stored = getStoredUser()
        if (stored) {
          setCurrentUser(stored)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: '#666' }}>
        Loading...
      </div>
    )
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!userEmail.trim()) {
      setAuthError('Email is required')
      return
    }

    try {
      setAuthError(null)
      const user = await loginOrCreate(userEmail.trim(), userName.trim() || undefined)
      const stored: StoredUser = { id: user.id, email: user.email, name: user.name }
      setStoredUser(stored)
      setCurrentUser(stored)
      setUserEmail('')
      setUserName('')
    } catch (error) {
      console.error('Login failed', error)
      setAuthError('Login failed. Please try again.')
    }
  }

  return (
    <div>
      <section style={{ marginBottom: '60px' }}>
        <form
          onSubmit={handleLogin}
          style={{
            background: '#101010',
            border: '1px solid #1f1f1f',
            borderRadius: '8px',
            padding: '25px',
            marginBottom: '40px',
          }}
        >
          <h3 style={{ color: '#fff', marginBottom: '15px', fontSize: '18px' }}>
            {currentUser ? `Logged in as ${currentUser.email}` : 'Sign in / Create user'}
          </h3>
          {!currentUser && (
            <>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#888' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #333',
                    background: '#0f0f0f',
                    color: '#fff',
                  }}
                  required
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '6px', color: '#888' }}>
                  Name (optional)
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="John Doe"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #333',
                    background: '#0f0f0f',
                    color: '#fff',
                  }}
                />
              </div>
              {authError && (
                <p style={{ color: '#f87171', fontSize: '13px', marginBottom: '10px' }}>{authError}</p>
              )}
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  background: '#60a5fa',
                  color: '#0a0a0a',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Continue
              </button>
            </>
          )}
          {currentUser && (
            <p style={{ color: '#60a5fa' }}>Welcome back, {currentUser.name || currentUser.email}!</p>
          )}
        </form>

        <h2 style={{
          fontSize: '24px',
          fontWeight: '300',
          marginBottom: '30px',
          color: '#ffffff',
          letterSpacing: '0.5px'
        }}>
          FEATURED PRODUCTS
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {products.map((product) => (
            <div
              key={product.id}
              style={{
                background: '#151515',
                border: '1px solid #1f1f1f',
                borderRadius: '8px',
                padding: '25px',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#333'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#1f1f1f'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <h3 style={{
                fontSize: '18px',
                marginBottom: '10px',
                color: '#ffffff',
                fontWeight: '400'
              }}>
                {product.name}
              </h3>
              <p style={{
                color: '#888',
                fontSize: '14px',
                marginBottom: '15px',
                lineHeight: '1.5'
              }}>
                {product.description}
              </p>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '20px',
                  fontWeight: '300',
                  color: '#60a5fa'
                }}>
                  ${product.price}
                </span>
                <span style={{
                  fontSize: '13px',
                  color: '#666',
                  letterSpacing: '0.5px'
                }}>
                  {product.stock} IN STOCK
                </span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <a
            href="/products"
            style={{
              display: 'inline-block',
              padding: '12px 30px',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '6px',
              color: '#e0e0e0',
              fontSize: '14px',
              letterSpacing: '0.5px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#252525'
              e.currentTarget.style.borderColor = '#444'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1a1a1a'
              e.currentTarget.style.borderColor = '#333'
            }}
          >
            VIEW ALL PRODUCTS
          </a>
        </div>
      </section>

      <section>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '300',
          marginBottom: '20px',
          color: '#ffffff',
          letterSpacing: '0.5px'
        }}>
          ACTIVE USERS
        </h2>
        <div style={{
          background: '#151515',
          border: '1px solid #1f1f1f',
          borderRadius: '8px',
          padding: '25px'
        }}>
          {users.map((user) => (
            <div
              key={user.id}
              style={{
                padding: '15px 0',
                borderBottom: '1px solid #1a1a1a',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ color: '#ffffff', marginBottom: '5px' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  {user.email}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStoredUser({ id: user.id, email: user.email, name: user.name })
                  setCurrentUser({ id: user.id, email: user.email, name: user.name })
                }}
                style={{
                  padding: '6px 12px',
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: '#e0e0e0',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Use this user
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
