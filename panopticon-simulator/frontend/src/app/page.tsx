'use client'

import { useEffect, useState } from 'react'
import { getProducts, getUsers, type Product, type User } from '@/lib/api'

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsData, usersData] = await Promise.all([
          getProducts(),
          getUsers(),
        ])
        setProducts(productsData.slice(0, 3)) // Show only 3 products
        setUsers(usersData)
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

  return (
    <div>
      <section style={{ marginBottom: '60px' }}>
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
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
