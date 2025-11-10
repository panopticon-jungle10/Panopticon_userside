'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getProducts, addToCart, type Product } from '@/lib/api'
import { getStoredUser, type StoredUser } from '@/lib/auth'

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const productsData = await getProducts()
        setProducts(productsData)
        const stored = getStoredUser()
        if (stored) {
          setCurrentUser(stored)
          setAuthError(null)
        } else {
          setAuthError('Please sign in on the home page to add items to your cart.')
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    function handleUserChange() {
      const stored = getStoredUser()
      setCurrentUser(stored)
      setAuthError(
        stored ? null : 'Please sign in on the home page to add items to your cart.',
      )
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('panopticon-user-change', handleUserChange)
      return () => window.removeEventListener('panopticon-user-change', handleUserChange)
    }
  }, [])

  const handleAddToCart = async (productId: string) => {
    if (!currentUser) {
      alert('로그인이 필요합니다. 홈에서 사용자 로그인 후 다시 시도하세요.')
      return
    }
    try {
      setAddingToCart(productId)
      await addToCart(currentUser.id, productId, 1)
      alert('Added to cart!')
    } catch (error) {
      console.error('Failed to add to cart:', error)
      alert('Failed to add to cart')
    } finally {
      setAddingToCart(null)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: '#666' }}>
        Loading...
      </div>
    )
  }

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

        <div style={{ color: '#888', fontSize: '13px' }}>
          {currentUser ? `Signed in as ${currentUser.email}` : authError || 'Not signed in'}
        </div>

        <button
          onClick={() => router.push('/cart')}
          style={{
            padding: '12px 24px',
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
          VIEW CART
        </button>
      </div>

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
              transition: 'all 0.3s ease'
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
              disabled={addingToCart === product.id || !currentUser}
              style={{
                width: '100%',
                padding: '12px',
                background:
                  addingToCart === product.id || !currentUser ? '#252525' : '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: '#e0e0e0',
                fontSize: '14px',
                letterSpacing: '0.5px',
                cursor:
                  addingToCart === product.id || !currentUser ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: addingToCart === product.id || !currentUser ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (addingToCart !== product.id && currentUser) {
                  e.currentTarget.style.background = '#252525'
                  e.currentTarget.style.borderColor = '#444'
                }
              }}
              onMouseLeave={(e) => {
                if (addingToCart !== product.id && currentUser) {
                  e.currentTarget.style.background = '#1a1a1a'
                  e.currentTarget.style.borderColor = '#333'
                }
              }}
            >
              {!currentUser
                ? 'SIGN IN TO ADD'
                : addingToCart === product.id
                  ? 'ADDING...'
                  : 'ADD TO CART'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
