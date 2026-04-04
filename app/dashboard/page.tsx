'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState('')
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserEmail(user.email ?? '')
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const menus = [
    { id: 'dashboard', label: '収益ダッシュボード' },
    { id: 'biolink', label: 'bioリンク管理', path: '/biolink' },
    { id: 'contents', label: 'コンテンツ管理' },
    { id: 'settings', label: '設定' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div style={{ width: '220px', background: '#fff', borderRight: '0.5px solid rgba(0,0,0,0.08)', padding: '24px 16px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px', paddingLeft: '8px' }}>
          <div style={{ width: '28px', height: '28px', background: '#1D9E75', borderRadius: '7px', flexShrink: 0 }}></div>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>Affiliater Tool</span>
        </div>

        <nav style={{ flex: 1 }}>
          {menus.map(m => (
            <button
              key={m.id}
              onClick={() => m.path ? router.push(m.path) : setActiveMenu(m.id)}
              style={{
                width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', marginBottom: '2px',
                background: activeMenu === m.id ? '#E1F5EE' : 'transparent',
                color: activeMenu === m.id ? '#085041' : '#555',
                fontWeight: activeMenu === m.id ? '500' : '400',
              }}
            >
              {m.label}
            </button>
          ))}
        </nav>

        <div style={{ borderTop: '0.5px solid rgba(0,0,0,0.08)', paddingTop: '16px' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px', paddingLeft: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</div>
          <button
            onClick={handleLogout}
            style={{ width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#888', background: 'transparent' }}
          >
            ログアウト
          </button>
        </div>
      </div>

      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {activeMenu === 'dashboard' && <DashboardContent />}
        {activeMenu === 'contents' && <ComingSoon title="コンテンツ管理" desc="記事・SNS投稿をここで管理できます。近日実装予定です。" />}
        {activeMenu === 'settings' && <ComingSoon title="設定" desc="ASP連携・プロフィール設定などができます。近日実装予定です。" />}
      </div>
    </div>
  )
}

function DashboardContent() {
  const metrics = [
    { label: '今月の収益（確定）', value: '¥0', sub: 'ASPを連携すると表示されます', color: '#1D9E75' },
    { label: '未確定（見込み）', value: '¥0', sub: '承認待ち 0件', color: '#534AB7' },
    { label: '目標達成率', value: '-%', sub: '目標を設定してください', color: '#1a1a1a' },
    { label: '今月の成果件数', value: '0件', sub: '前月比 -', color: '#1a1a1a' },
  ]

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '500', margin: '0 0 4px', color: '#1a1a1a' }}>収益ダッシュボード</h2>
        <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>ASPを連携するとリアルタイムで収益が表示されます</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {metrics.map((m, i) => (
          <div key={i} style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>{m.label}</div>
            <div style={{ fontSize: '24px', fontWeight: '500', color: m.color, marginBottom: '4px' }}>{m.value}</div>
            <div style={{ fontSize: '11px', color: '#aaa' }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: '12px', padding: '24px' }}>
        <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '16px' }}>次のステップ</div>
        {[
          { num: '1', text: 'bioリンクを設定してInstagramからの流入を計測する' },
          { num: '2', text: 'ASPアカウントを連携して収益データを取り込む' },
          { num: '3', text: 'コンテンツを登録して管理を始める' },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i < 2 ? '0.5px solid rgba(0,0,0,0.06)' : 'none' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '500', color: '#085041', flexShrink: 0 }}>{s.num}</div>
            <span style={{ fontSize: '13px', color: '#555' }}>{s.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ComingSoon({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: '500', margin: '0 0 4px', color: '#1a1a1a' }}>{title}</h2>
      <p style={{ fontSize: '13px', color: '#888', margin: '0 0 32px' }}>{desc}</p>
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#aaa' }}>この機能は現在開発中です</div>
      </div>
    </div>
  )
}
