'use client'

import { useEffect, useState } from 'react'
import { getProducts, createOrder, getUsers, type Product, type User } from '@/lib/api'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [cart, setCart] = useState<{ [key: string]: number }>({})
  const [loading, setLoading] = useState(true)
  const [orderStatus, setOrderStatus] = useState<string>('')

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsData, usersData] = await Promise.all([
          getProducts(),
          getUsers(),
        ])
        setProducts(productsData)
        setUsers(usersData)
        if (usersData.length > 0) {
          setSelectedUser(usersData[0].id)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleAddToCart = (productId: string) => {
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }))
  }

  const handleCreateOrder = async () => {
    if (!selectedUser) {
      setOrderStatus('Please select a user')
      return
    }

    const items = Object.entries(cart)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }))

    if (items.length === 0) {
      setOrderStatus('Cart is empty')
      return
    }

    try {
      const order = await createOrder(selectedUser, items)
      setOrderStatus(`Order created successfully! Total: $${order.totalAmount}`)
      setCart({})
      setTimeout(() => setOrderStatus(''), 3000)
    } catch (error) {
      setOrderStatus('Failed to create order')
      setTimeout(() => setOrderStatus(''), 3000)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: '#666' }}>
        Loading...
      </div>
    )
  }

  const cartTotal = Object.entries(cart).reduce((sum, [productId, qty]) => {
    const product = products.find(p => p.id === productId)
    return sum + (product ? product.price * qty : 0)
  }, 0)

  const cartItemCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0)

  return (
    <div>
      <div style={{
        marginBottom: '30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '300',
          color: '#ffffff',
          letterSpacing: '0.5px'
        }}>
          ALL PRODUCTS
        </h2>

        {cartItemCount > 0 && (
          <div style={{
            background: '#151515',
            border: '1px solid #1f1f1f',
            borderRadius: '6px',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            <span style={{ color: '#888', fontSize: '14px' }}>
              Cart: {cartItemCount} items
            </span>
            <span style={{ color: '#60a5fa', fontSize: '16px', fontWeight: '300' }}>
              ${cartTotal.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        {products.map((product) => {
          const inCart = cart[product.id] || 0
          return (
            <div
              key={product.id}
              style={{
                background: '#151515',
                border: '1px solid #1f1f1f',
                borderRadius: '8px',
                padding: '25px',
                transition: 'all 0.3s ease',
                position: 'relative'
              }}
            >
              {inCart > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  background: '#60a5fa',
                  color: '#0a0a0a',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  {inCart}
                </div>
              )}

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
                alignItems: 'center',
                marginBottom: '20px'
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
              <button
                onClick={() => handleAddToCart(product.id)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: '#e0e0e0',
                  fontSize: '14px',
                  letterSpacing: '0.5px',
                  cursor: 'pointer',
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
                ADD TO CART
              </button>
            </div>
          )
        })}
      </div>

      {cartItemCount > 0 && (
        <div style={{
          background: '#151515',
          border: '1px solid #1f1f1f',
          borderRadius: '8px',
          padding: '30px',
          marginTop: '40px'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '300',
            marginBottom: '20px',
            color: '#ffffff',
            letterSpacing: '0.5px'
          }}>
            CHECKOUT
          </h3>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '10px',
              color: '#888',
              fontSize: '14px',
              letterSpacing: '0.5px'
            }}>
              SELECT USER:
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: '#e0e0e0',
                fontSize: '14px'
              }}
            >
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            paddingTop: '20px',
            borderTop: '1px solid #1f1f1f'
          }}>
            <span style={{ color: '#888', fontSize: '16px' }}>TOTAL:</span>
            <span style={{ color: '#60a5fa', fontSize: '24px', fontWeight: '300' }}>
              ${cartTotal.toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleCreateOrder}
            style={{
              width: '100%',
              padding: '15px',
              background: '#60a5fa',
              border: 'none',
              borderRadius: '6px',
              color: '#0a0a0a',
              fontSize: '14px',
              fontWeight: '500',
              letterSpacing: '0.5px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#93c5fd'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#60a5fa'
            }}
          >
            PLACE ORDER
          </button>

          {orderStatus && (
            <div style={{
              marginTop: '15px',
              padding: '12px',
              background: orderStatus.includes('successfully') ? '#1a3a1a' : '#3a1a1a',
              border: orderStatus.includes('successfully') ? '1px solid #2a4a2a' : '1px solid #4a2a2a',
              borderRadius: '6px',
              color: orderStatus.includes('successfully') ? '#6dd46d' : '#ff6b6b',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              {orderStatus}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
