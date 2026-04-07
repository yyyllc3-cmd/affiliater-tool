'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

type Props = {
  message?: string
}

export default function UpgradePrompt({ message = 'この機能はProプランでご利用いただけます' }: Props) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleUpgrade = async () => {
    setLoading(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setError('ログインが必要です'); setLoading(false); return }
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'エラーが発生しました'); setLoading(false); return }
      if (json.url) {
        window.location.href = json.url
      } else {
        setError('決済URLの取得に失敗しました')
        setLoading(false)
      }
    } catch (e) {
      setError('通信エラーが発生しました')
      setLoading(false)
    }
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
        disabled={loading}
        style={{
          padding: '12px 32px',
          background: loading ? '#9ca3af' : 'linear-gradient(135deg, #1D9E75, #0f7a5a)',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: loading ? 'none' : '0 2px 12px rgba(29,158,117,0.35)',
        }}
      >
        {loading ? '処理中...' : 'Proプランにアップグレード — ¥980/月'}
      </button>
      {error && (
        <div style={{ marginTop: '12px', fontSize: '12px', color: '#ef4444', background: '#FEF2F2', padding: '8px 14px', borderRadius: '6px' }}>
          {error}
        </div>
      )}
    </div>
  )
}
