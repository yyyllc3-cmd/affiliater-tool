'use client'
import { createClient } from '@/lib/supabase'

type Props = {
  message?: string
}

export default function UpgradePrompt({ message = 'この機能はProプランでご利用いただけます' }: Props) {
  const supabase = createClient()

  const handleUpgrade = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    const { url } = await res.json()
    if (url) window.location.href = url
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f0fdf9 0%, #eff6ff 100%)',
      border: '1px solid #a7f3d0',
      borderRadius: '16px',
      padding: '40px 32px',
      textAlign: 'center',
      maxWidth: '480px',
      margin: '0 auto',
    }}>
      <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔒</div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' }}>
        Proプラン限定機能
      </div>
      <div style={{ fontSize: '13px', color: '#555', marginBottom: '24px', lineHeight: 1.7 }}>
        {message}
      </div>
      <button
        onClick={handleUpgrade}
        style={{
          padding: '12px 32px',
          background: 'linear-gradient(135deg, #1D9E75, #0f7a5a)',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 2px 12px rgba(29,158,117,0.35)',
        }}
      >
        Proプランにアップグレード — ¥980/月
      </button>
    </div>
  )
}
