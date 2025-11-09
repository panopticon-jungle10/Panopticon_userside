'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  type Cart,
  createOrder,
} from '@/lib/api'
import { getStoredUser } from '@/lib/auth'

export default function CartPage() {
  const router = useRouter()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    const stored = getStoredUser()
    if (stored) {
      setUserId(stored.id)
      fetchCart(stored.id)
    } else {
      setLoading(false)
      setAuthError('로그인이 필요합니다. 홈에서 사용자 로그인 후 다시 시도하세요.')
    }
  }, [])

  async function fetchCart(currentUserId: string) {
    try {
      setLoading(true)
      const cartData = await getCart(currentUserId)
      setCart(cartData)
    } catch (error) {
      console.error('Failed to fetch cart:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleQuantityChange(productId: string, newQuantity: number) {
    if (!userId) return
    if (newQuantity < 1) return

    try {
      setUpdating(true)
      const updatedCart = await updateCartItemQuantity(userId, productId, newQuantity)
      setCart(updatedCart)
    } catch (error) {
      console.error('Failed to update quantity:', error)
      alert('Failed to update quantity')
    } finally {
      setUpdating(false)
    }
  }

  async function handleRemoveItem(productId: string) {
    if (!userId) return
    try {
      setUpdating(true)
      const updatedCart = await removeFromCart(userId, productId)
      setCart(updatedCart)
    } catch (error) {
      console.error('Failed to remove item:', error)
      alert('Failed to remove item')
    } finally {
      setUpdating(false)
    }
  }

  async function handleClearCart() {
    if (!userId) return
    if (!confirm('Are you sure you want to clear your cart?')) return

    try {
      setUpdating(true)
      const updatedCart = await clearCart(userId)
      setCart(updatedCart)
    } catch (error) {
      console.error('Failed to clear cart:', error)
      alert('Failed to clear cart')
    } finally {
      setUpdating(false)
    }
  }

  async function handleCheckout() {
    if (!userId || !cart || cart.items.length === 0) return

    try {
      setUpdating(true)
      const orderItems = cart.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      }))

      const order = await createOrder(userId, orderItems)
      await clearCart(userId)

      alert(`Order created successfully! Order ID: ${order.id}`)
      router.push('/')
    } catch (error) {
      console.error('Failed to create order:', error)
      alert('Failed to create order')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: '#666' }}>
        Loading cart...
      </div>
    )
  }

  if (authError) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: '#f87171' }}>
        {authError}
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '300',
          marginBottom: '20px',
          color: '#ffffff',
          letterSpacing: '0.5px'
        }}>
          YOUR CART IS EMPTY
        </h2>
        <p style={{ color: '#888', marginBottom: '30px' }}>
          Add some products to get started
        </p>
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
            transition: 'all 0.2s',
            textDecoration: 'none'
          }}
        >
          BROWSE PRODUCTS
        </a>
      </div>
    )
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '300',
          color: '#ffffff',
          letterSpacing: '0.5px'
        }}>
          SHOPPING CART
        </h2>
        <button
          onClick={handleClearCart}
          disabled={updating}
          style={{
            padding: '8px 20px',
            background: 'transparent',
            border: '1px solid #444',
            borderRadius: '6px',
            color: '#888',
            fontSize: '13px',
            letterSpacing: '0.5px',
            cursor: updating ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            opacity: updating ? 0.5 : 1
          }}
          onMouseEnter={(e) => !updating && (e.currentTarget.style.borderColor = '#666')}
          onMouseLeave={(e) => !updating && (e.currentTarget.style.borderColor = '#444')}
        >
          CLEAR CART
        </button>
      </div>

      <div style={{
        background: '#151515',
        border: '1px solid #1f1f1f',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        {cart.items.map((item, index) => (
          <div
            key={item.productId}
            style={{
              padding: '20px 25px',
              borderBottom: index < cart.items.length - 1 ? '1px solid #1a1a1a' : 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ flex: 1 }}>
              <h3 style={{
                fontSize: '16px',
                color: '#ffffff',
                marginBottom: '5px',
                fontWeight: '400'
              }}>
                {item.productName}
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#60a5fa',
                fontWeight: '300'
              }}>
                ${item.price.toFixed(2)}
              </p>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                  disabled={updating || item.quantity <= 1}
                  style={{
                    width: '30px',
                    height: '30px',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    color: '#e0e0e0',
                    cursor: (updating || item.quantity <= 1) ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    opacity: (updating || item.quantity <= 1) ? 0.3 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  -
                </button>
                <span style={{
                  minWidth: '30px',
                  textAlign: 'center',
                  color: '#ffffff',
                  fontSize: '14px'
                }}>
                  {item.quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                  disabled={updating}
                  style={{
                    width: '30px',
                    height: '30px',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    color: '#e0e0e0',
                    cursor: updating ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    opacity: updating ? 0.5 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  +
                </button>
              </div>

              <div style={{
                fontSize: '16px',
                color: '#ffffff',
                minWidth: '80px',
                textAlign: 'right'
              }}>
                ${(item.price * item.quantity).toFixed(2)}
              </div>

              <button
                onClick={() => handleRemoveItem(item.productId)}
                disabled={updating}
                style={{
                  padding: '6px 15px',
                  background: 'transparent',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  color: '#888',
                  fontSize: '12px',
                  cursor: updating ? 'not-allowed' : 'pointer',
                  opacity: updating ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => !updating && (e.currentTarget.style.borderColor = '#ff4444')}
                onMouseLeave={(e) => !updating && (e.currentTarget.style.borderColor = '#444')}
              >
                REMOVE
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: '#151515',
        border: '1px solid #1f1f1f',
        borderRadius: '8px',
        padding: '25px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <span style={{
            fontSize: '18px',
            color: '#ffffff',
            fontWeight: '300',
            letterSpacing: '0.5px'
          }}>
            TOTAL
          </span>
          <span style={{
            fontSize: '24px',
            color: '#60a5fa',
            fontWeight: '300'
          }}>
            ${cart.totalAmount.toFixed(2)}
          </span>
        </div>

        <button
          onClick={handleCheckout}
          disabled={updating}
          style={{
            width: '100%',
            padding: '15px',
            background: '#60a5fa',
            border: 'none',
            borderRadius: '6px',
            color: '#000000',
            fontSize: '14px',
            fontWeight: '500',
            letterSpacing: '0.5px',
            cursor: updating ? 'not-allowed' : 'pointer',
            opacity: updating ? 0.5 : 1,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => !updating && (e.currentTarget.style.background = '#7bb5fb')}
          onMouseLeave={(e) => !updating && (e.currentTarget.style.background = '#60a5fa')}
        >
          {updating ? 'PROCESSING...' : 'PROCEED TO CHECKOUT'}
        </button>
      </div>
    </div>
  )
}
