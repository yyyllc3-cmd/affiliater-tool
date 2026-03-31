'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async () => {
    setLoading(true)
    setMessage('')
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { setMessage(error.message); setLoading(false); return }
      setMessage('確認メールを送信しました。メールを確認してください。')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setMessage('メールアドレスまたはパスワードが正しくありません'); setLoading(false); return }
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '400px' }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ width: '40px', height: '40px', background: '#1D9E75', borderRadius: '10px', marginBottom: '16px' }}></div>
          <h1 style={{ fontSize: '20px', fontWeight: '500', margin: '0 0 6px', color: '#1a1a1a' }}>Affiliater Tool</h1>
          <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>{isSignUp ? '新規アカウントを作成' : 'アカウントにログイン'}</p>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '6px' }}>メールアドレス</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            style={{ width: '100%', padding: '10px 12px', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '6px' }}>パスワード</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={e => e.key === 'Enter' && handleAuth()}
            style={{ width: '100%', padding: '10px 12px', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {message && (
          <div style={{ fontSize: '12px', padding: '10px 12px', borderRadius: '8px', marginBottom: '16px', background: message.includes('送信') ? '#E1F5EE' : '#FCEBEB', color: message.includes('送信') ? '#085041' : '#791F1F' }}>
            {message}
          </div>
        )}

        <button
          onClick={handleAuth}
          disabled={loading || !email || !password}
          style={{ width: '100%', padding: '12px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading || !email || !password ? 0.6 : 1 }}
        >
          {loading ? '処理中...' : isSignUp ? 'アカウントを作成' : 'ログイン'}
        </button>

        <button
          onClick={() => { setIsSignUp(!isSignUp); setMessage('') }}
          style={{ width: '100%', marginTop: '12px', padding: '10px', background: 'transparent', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: '8px', fontSize: '13px', color: '#555', cursor: 'pointer' }}
        >
          {isSignUp ? 'ログインはこちら' : '新規登録はこちら'}
        </button>
      </div>
    </div>
  )
}
