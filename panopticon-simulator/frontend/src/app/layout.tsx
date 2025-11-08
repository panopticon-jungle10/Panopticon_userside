import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'E-commerce Store',
  description: 'Simple e-commerce store for observability testing',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            background: #0a0a0a;
            color: #e0e0e0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
          }
          a {
            color: #60a5fa;
            text-decoration: none;
            transition: color 0.2s;
          }
          a:hover {
            color: #93c5fd;
          }
        `}</style>
      </head>
      <body>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
          <nav style={{
            marginBottom: '30px',
            padding: '25px 0',
            borderBottom: '1px solid #1f1f1f',
            background: 'linear-gradient(to bottom, #0a0a0a, transparent)'
          }}>
            <h1 style={{
              margin: 0,
              fontSize: '28px',
              fontWeight: '300',
              letterSpacing: '0.5px',
              color: '#ffffff'
            }}>
              E-COMMERCE STORE
            </h1>
            <div style={{
              marginTop: '15px',
              display: 'flex',
              gap: '30px',
              fontSize: '14px',
              letterSpacing: '0.5px'
            }}>
              <a href="/">HOME</a>
              <a href="/products">PRODUCTS</a>
              <a href="/cart">CART</a>
            </div>
          </nav>
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}
