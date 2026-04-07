'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts'

export default function DashboardPage() {
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [isPro, setIsPro] = useState(false)
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserEmail(user.email ?? '')
      setUserId(user.id)
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_pro')
        .eq('id', user.id)
        .single()
      if (profile?.is_pro) setIsPro(true)
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
    { id: 'asp', label: 'ASP連携', path: '/asp' },
    { id: 'shortlink', label: '短縮リンク', path: '/shortlink' },
    { id: 'profile', label: 'プロフィール設定', path: '/profile' },
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
        {activeMenu === 'dashboard' && <DashboardContent userId={userId} isPro={isPro} />}
        {activeMenu === 'contents' && <ComingSoon title="コンテンツ管理" desc="記事・SNS投稿をここで管理できます。近日実装予定です。" />}
        {activeMenu === 'settings' && <ComingSoon title="設定" desc="ASP連携・プロフィール設定などができます。近日実装予定です。" />}
      </div>
    </div>
  )
}

function DashboardContent({ userId, isPro }: { userId: string; isPro: boolean }) {
  const supabase = createClient()
  const [aspEarnings, setAspEarnings] = useState<{ earnings: number; cv_count: number } | null>(null)

  useEffect(() => {
    if (!userId) return
    const thisMonth = new Date()
    const monthDate = `${thisMonth.getFullYear()}-${String(thisMonth.getMonth() + 1).padStart(2, '0')}-01`
    supabase
      .from('asp_earnings')
      .select('earnings, cv_count')
      .eq('user_id', userId)
      .eq('month', monthDate)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const total = data.reduce((acc, r) => ({ earnings: acc.earnings + Number(r.earnings), cv_count: acc.cv_count + r.cv_count }), { earnings: 0, cv_count: 0 })
          setAspEarnings(total)
        }
      })
  }, [userId])

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

  const metrics = [
    {
      label: '今月の収益（確定）',
      value: aspEarnings ? `¥${aspEarnings.earnings.toLocaleString()}` : '¥0',
      sub: aspEarnings ? 'A8.net連携済み' : 'ASPを連携すると表示されます',
      color: '#1D9E75',
    },
    { label: '未確定（見込み）', value: '¥0', sub: '承認待ち 0件', color: '#534AB7' },
    { label: '目標達成率', value: '-%', sub: '目標を設定してください', color: '#1a1a1a' },
    {
      label: '今月の成果件数',
      value: aspEarnings ? `${aspEarnings.cv_count}件` : '0件',
      sub: '前月比 -',
      color: '#1a1a1a',
    },
  ]

  return (
    <div>
      {!isPro && (
        <div style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #534AB7 100%)', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', marginBottom: '2px' }}>Proプランにアップグレード</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>全機能アンロック・クリック分析・ASP連携など</div>
          </div>
          <button
            onClick={handleUpgrade}
            style={{ background: '#fff', color: '#1D9E75', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            ¥980/月
          </button>
        </div>
      )}
      {isPro && (
        <div style={{ background: '#E1F5EE', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '12px 20px', marginBottom: '20px', fontSize: '13px', color: '#085041', fontWeight: '500' }}>
          Proプラン利用中
        </div>
      )}

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

      {userId && <ClickAnalytics userId={userId} />}
      {userId && <ReferrerChart userId={userId} />}
    </div>
  )
}

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

function ClickAnalytics({ userId }: { userId: string }) {
  const supabase = createClient()
  const [barData, setBarData] = useState<{ date: string; clicks: number }[]>([])
  const [heatmap, setHeatmap] = useState<Record<number, Record<number, number>>>({})
  const [maxHeat, setMaxHeat] = useState(1)

  useEffect(() => {
    if (!userId) return
    const since = new Date()
    since.setDate(since.getDate() - 6)
    since.setHours(0, 0, 0, 0)

    supabase
      .from('link_clicks')
      .select('clicked_at, day_of_week, hour_of_day')
      .eq('user_id', userId)
      .gte('clicked_at', since.toISOString())
      .then(({ data }) => {
        if (!data) return

        // 棒グラフ：過去7日間
        const counts: Record<string, number> = {}
        for (let i = 6; i >= 0; i--) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          counts[d.toISOString().split('T')[0]] = 0
        }
        data.forEach(row => {
          const day = row.clicked_at.split('T')[0]
          if (day in counts) counts[day]++
        })
        setBarData(
          Object.entries(counts).map(([date, clicks]) => ({
            date: date.slice(5), // MM-DD
            clicks,
          }))
        )

        // ヒートマップ：曜日×時間帯（全期間）
        const grid: Record<number, Record<number, number>> = {}
        for (let d = 0; d <= 6; d++) {
          grid[d] = {}
          for (let h = 0; h < 24; h++) grid[d][h] = 0
        }
        data.forEach(row => {
          grid[row.day_of_week][row.hour_of_day]++
        })
        const max = Math.max(1, ...Object.values(grid).flatMap(h => Object.values(h)))
        setHeatmap(grid)
        setMaxHeat(max)
      })
  }, [userId])

  const heatColor = (count: number) => {
    if (count === 0) return '#f0f0f0'
    const ratio = count / maxHeat
    const r = Math.round(225 - ratio * 196)
    const g = Math.round(245 - ratio * 87)
    const b = Math.round(238 - ratio * 121)
    return `rgb(${r},${g},${b})`
  }

  return (
    <>
      {/* 過去7日間 棒グラフ */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: '12px', padding: '24px', marginBottom: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '16px' }}>過去7日間のクリック数</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '0.5px solid rgba(0,0,0,0.1)', boxShadow: 'none' }}
              formatter={(v) => [v, 'クリック']}
            />
            <Bar dataKey="clicks" fill="#1D9E75" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 曜日×時間帯 ヒートマップ */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: '12px', padding: '24px', marginBottom: '12px', overflowX: 'auto' }}>
        <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '16px' }}>曜日 × 時間帯のクリック分布</div>
        <div style={{ display: 'grid', gridTemplateColumns: '28px repeat(24, 1fr)', gap: '2px', minWidth: '520px' }}>
          {/* ヘッダー行（時間） */}
          <div />
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} style={{ fontSize: '9px', color: '#aaa', textAlign: 'center' }}>
              {h % 3 === 0 ? `${h}` : ''}
            </div>
          ))}
          {/* データ行（曜日ごと） */}
          {DAY_LABELS.map((label, d) => (
            <>
              <div key={`label-${d}`} style={{ fontSize: '11px', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {label}
              </div>
              {Array.from({ length: 24 }, (_, h) => {
                const count = heatmap[d]?.[h] ?? 0
                return (
                  <div
                    key={`cell-${d}-${h}`}
                    title={`${label} ${h}時: ${count}クリック`}
                    style={{
                      aspectRatio: '1',
                      borderRadius: '2px',
                      background: heatColor(count),
                    }}
                  />
                )
              })}
            </>
          ))}
        </div>
        {/* 凡例 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '10px', color: '#aaa' }}>少</span>
          {[0, 0.25, 0.5, 0.75, 1].map(r => (
            <div key={r} style={{ width: '12px', height: '12px', borderRadius: '2px', background: heatColor(Math.round(r * maxHeat)) }} />
          ))}
          <span style={{ fontSize: '10px', color: '#aaa' }}>多</span>
        </div>
      </div>
    </>
  )
}

const REFERRER_COLORS = ['#1D9E75', '#534AB7', '#F59E0B', '#EF4444', '#3B82F6', '#6B7280']

function classifyReferrer(ref: string | null): string {
  if (!ref) return '直接アクセス'
  if (ref.includes('instagram.com')) return 'Instagram'
  if (ref.includes('twitter.com') || ref.includes('x.com')) return 'Twitter/X'
  if (ref.includes('tiktok.com')) return 'TikTok'
  if (ref.includes('youtube.com')) return 'YouTube'
  if (ref.includes('facebook.com')) return 'Facebook'
  return 'その他'
}

function ReferrerChart({ userId }: { userId: string }) {
  const supabase = createClient()
  const [data, setData] = useState<{ name: string; value: number }[]>([])

  useEffect(() => {
    if (!userId) return
    supabase
      .from('link_clicks')
      .select('referrer')
      .eq('user_id', userId)
      .then(({ data: clicks }) => {
        if (!clicks || clicks.length === 0) return
        const counts: Record<string, number> = {}
        clicks.forEach(c => {
          const key = classifyReferrer(c.referrer)
          counts[key] = (counts[key] || 0) + 1
        })
        setData(Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value))
      })
  }, [userId])

  if (data.length === 0) return null

  return (
    <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: '12px', padding: '24px', marginTop: '12px' }}>
      <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '16px' }}>流入元分析</div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false} fontSize={11}>
            {data.map((_, i) => (
              <Cell key={i} fill={REFERRER_COLORS[i % REFERRER_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => [v, 'クリック']} />
          <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
        </PieChart>
      </ResponsiveContainer>
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
