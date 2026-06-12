import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

// Global error boundary to catch any crash and show a message instead of blank page
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('App crashed:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: '#0a1628', padding: 24,
          fontFamily: 'DM Sans, sans-serif'
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: '40px 32px',
            maxWidth: 480, width: '100%', textAlign: 'center'
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: '#0a1628', marginBottom: 8 }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20, lineHeight: 1.6 }}>
              The portal failed to load. This is usually caused by missing environment variables.
              Check that your <strong>.env</strong> file has the correct Supabase URL and anon key.
            </p>
            <p style={{ fontSize: 12, color: '#94a3b8', background: '#f8fafc', borderRadius: 8, padding: '10px 14px', textAlign: 'left', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {this.state.error?.message || 'Unknown error'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: 20, background: '#2db84b', color: 'white',
                border: 'none', borderRadius: 8, padding: '10px 24px',
                fontSize: 14, fontWeight: 600, cursor: 'pointer'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            },
            success: {
              iconTheme: { primary: '#2db84b', secondary: 'white' },
            },
          }}
        />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)