'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const FEATURES = [
  { icon: '🔗', title: 'bioリンク管理', desc: 'Instagramのプロフィールリンクを一元管理。ドラッグ&ドロップで簡単並び替え。' },
  { icon: '📊', title: 'クリック分析', desc: '曜日・時間帯ごとのクリック数をヒートマップでリアルタイム可視化。' },
  { icon: '📱', title: 'QRコード生成', desc: '公開ページのQRコードを自動生成。オフライン集客にも対応。' },
  { icon: '💰', title: 'ASP連携', desc: 'A8.netなど主要ASPと連携して収益データを自動取得・管理。' },
  { icon: '✂️', title: '短縮URL', desc: 'アフィリエイトURLを短縮してクリック数を計測。見た目もスッキリ。' },
  { icon: '🌊', title: '流入元分析', desc: 'Instagram・Twitter・直接アクセスなど流入元を円グラフで可視化。' },
]

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
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) { setMessage(error.message); setLoading(false); return }
      if (data.user?.identities?.length === 0) {
        setMessage('このメールアドレスはすでに登録済みです')
        setLoading(false)
        return
      }
      setMessage('確認メールを送信しました。メールを確認してください。')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setMessage('メールアドレスまたはパスワードが正しくありません'); setLoading(false); return }
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Noto Sans JP', sans-serif" }}>

      {/* 左：ヒーローエリア */}
      <div style={{
        flex: 1, display: 'none',
        background: 'linear-gradient(145deg, #0a2e1f 0%, #0f4a32 40%, #1D9E75 100%)',
        padding: '48px',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }} className="hero-panel">

        {/* 背景装飾 */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '320px', height: '320px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '240px', height: '240px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        {/* ロゴ */}
        <div style={{ marginBottom: '48px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>💹</div>
            <span style={{ fontSize: '22px', fontWeight: '700', color: '#fff', letterSpacing: '0.02em' }}>Affiliater Tool</span>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#fff', margin: '0 0 12px', lineHeight: 1.3 }}>
            アフィリエイト収益を<br />もっとスマートに。
          </h2>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.8 }}>
            bioリンク・クリック分析・ASP連携をひとつのツールで。<br />
            収益最大化のための管理プラットフォーム。
          </p>
        </div>

        {/* 機能一覧 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', position: 'relative' }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '16px',
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{ fontSize: '22px', marginBottom: '6px' }}>{f.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', marginBottom: '4px' }}>{f.title}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* 実績バッジ */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '32px', position: 'relative' }}>
          {['無料で始める', 'クレジットカード不要', 'すぐに使える'].map((badge, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
              <span style={{ color: '#4ade80' }}>✓</span>{badge}
            </div>
          ))}
        </div>
      </div>

      {/* 右：フォームエリア */}
      <div style={{
        width: '100%',
        maxWidth: '480px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        background: '#fafafa',
      }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>

          {/* モバイル用ロゴ */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #1D9E75, #0f4a32)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>💹</div>
              <span style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a' }}>Affiliater Tool</span>
            </div>
            <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>アフィリエイト収益管理プラットフォーム</p>
          </div>

          {/* カード */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '0.5px solid rgba(0,0,0,0.07)' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 6px' }}>
              {isSignUp ? '無料アカウントを作成' : 'おかえりなさい'}
            </h3>
            <p style={{ fontSize: '12px', color: '#888', margin: '0 0 24px' }}>
              {isSignUp ? 'メールアドレスとパスワードを入力してください' : 'メールアドレスとパスワードでログイン'}
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: '500', color: '#444', display: 'block', marginBottom: '6px' }}>メールアドレス</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={{ width: '100%', padding: '11px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: '#fafafa', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#1D9E75'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: '500', color: '#444', display: 'block', marginBottom: '6px' }}>パスワード</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={e => e.key === 'Enter' && handleAuth()}
                style={{ width: '100%', padding: '11px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: '#fafafa', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#1D9E75'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            {message && (
              <div style={{
                fontSize: '12px', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px',
                background: message.includes('送信') ? '#E1F5EE' : '#FEF2F2',
                color: message.includes('送信') ? '#085041' : '#991B1B',
                borderLeft: `3px solid ${message.includes('送信') ? '#1D9E75' : '#EF4444'}`,
              }}>
                {message}
              </div>
            )}

            <button
              onClick={handleAuth}
              disabled={loading || !email || !password}
              style={{
                width: '100%', padding: '12px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
                cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
                background: loading || !email || !password ? '#d1d5db' : 'linear-gradient(135deg, #1D9E75, #0f7a5a)',
                color: '#fff',
                transition: 'opacity 0.2s',
                boxShadow: loading || !email || !password ? 'none' : '0 2px 12px rgba(29,158,117,0.35)',
              }}
            >
              {loading ? '処理中...' : isSignUp ? 'アカウントを作成する' : 'ログイン'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                onClick={() => { setIsSignUp(!isSignUp); setMessage('') }}
                style={{ background: 'none', border: 'none', fontSize: '12px', color: '#1D9E75', cursor: 'pointer', fontWeight: '500' }}
              >
                {isSignUp ? 'すでにアカウントをお持ちの方はこちら →' : '新規登録はこちら →'}
              </button>
            </div>
          </div>

          {/* 機能ハイライト（モバイル用） */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '24px' }}>
            {FEATURES.slice(0, 3).map((f, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '12px 8px', background: '#fff', borderRadius: '10px', border: '0.5px solid rgba(0,0,0,0.07)' }}>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{f.icon}</div>
                <div style={{ fontSize: '10px', fontWeight: '500', color: '#555' }}>{f.title}</div>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', fontSize: '11px', color: '#bbb', marginTop: '20px' }}>
            © Affiliater Tool YYYLLC 2026
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .hero-panel { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
