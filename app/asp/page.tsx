'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type AspConfig = {
  id: string
  label: string
  color: string
  fields: { key: 'api_key' | 'api_secret'; label: string; placeholder: string; type: string }[]
  apiPath: string
  helpText: string
}

const ASP_LIST: AspConfig[] = [
  {
    id: 'a8net',
    label: 'A8.net',
    color: '#FF6600',
    fields: [
      { key: 'api_key', label: 'メディアID（wid）', placeholder: 's00000000000000', type: 'text' },
      { key: 'api_secret', label: 'ログインパスワード', placeholder: 'A8.netのログインパスワード', type: 'password' },
    ],
    apiPath: '/api/asp/a8',
    helpText: 'メディアIDはA8.netマイページ →「メディア管理」で確認できます。',
  },
  {
    id: 'moshimo',
    label: 'もしもアフィリエイト',
    color: '#E8465A',
    fields: [
      { key: 'api_key', label: 'APIキー', placeholder: 'もしもアフィリエイトのAPIキー', type: 'text' },
      { key: 'api_secret', label: 'シークレットキー', placeholder: 'シークレットキー', type: 'password' },
    ],
    apiPath: '/api/asp/moshimo',
    helpText: 'APIキーはもしもアフィリエイトのマイページ →「API設定」で発行できます。',
  },
  {
    id: 'valuecommerce',
    label: 'バリューコマース',
    color: '#0066CC',
    fields: [
      { key: 'api_key', label: 'SID（パブリッシャーID）', placeholder: 'バリューコマースのSID', type: 'text' },
      { key: 'api_secret', label: 'APIトークン', placeholder: 'APIトークン', type: 'password' },
    ],
    apiPath: '/api/asp/valuecommerce',
    helpText: 'SIDとAPIトークンはバリューコマースのツールサイトで確認できます。',
  },
]

type Earning = {
  month: string
  earnings: number
  click_count: number
  cv_count: number
}

export default function AspPage() {
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [activeTab, setActiveTab] = useState('a8net')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserEmail(user.email ?? '')
      setUserId(user.id)
    })
  }, [])

  const menus = [
    { id: 'dashboard', label: '収益ダッシュボード', path: '/dashboard' },
    { id: 'biolink', label: 'bioリンク管理', path: '/biolink' },
    { id: 'contents', label: 'コンテンツ管理' },
    { id: 'asp', label: 'ASP連携', path: '/asp' },
    { id: 'shortlink', label: '短縮リンク', path: '/shortlink' },
    { id: 'profile', label: 'プロフィール設定', path: '/profile' },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const activeAsp = ASP_LIST.find(a => a.id === activeTab)!

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: '220px', background: '#fff', borderRight: '0.5px solid rgba(0,0,0,0.08)', padding: '24px 16px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px', paddingLeft: '8px' }}>
          <div style={{ width: '28px', height: '28px', background: '#1D9E75', borderRadius: '7px', flexShrink: 0 }} />
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>Affiliater Tool</span>
        </div>
        <nav style={{ flex: 1 }}>
          {menus.map(m => (
            <button
              key={m.id}
              onClick={() => m.path ? router.push(m.path) : undefined}
              style={{
                width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: '8px', border: 'none',
                cursor: m.path ? 'pointer' : 'default', fontSize: '13px', marginBottom: '2px',
                background: m.id === 'asp' ? '#E1F5EE' : 'transparent',
                color: m.id === 'asp' ? '#085041' : '#555',
                fontWeight: m.id === 'asp' ? '500' : '400',
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

      {/* Main */}
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '500', margin: '0 0 4px', color: '#1a1a1a' }}>ASP連携</h2>
        <p style={{ fontSize: '13px', color: '#888', margin: '0 0 24px' }}>ASPのAPIキーを登録して収益データを自動取得できます</p>

        {/* タブ */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', paddingBottom: '0' }}>
          {ASP_LIST.map(asp => (
            <button
              key={asp.id}
              onClick={() => setActiveTab(asp.id)}
              style={{
                padding: '8px 18px', border: 'none', cursor: 'pointer', fontSize: '13px', background: 'transparent',
                color: activeTab === asp.id ? '#1a1a1a' : '#999',
                fontWeight: activeTab === asp.id ? '500' : '400',
                borderBottom: activeTab === asp.id ? '2px solid #1D9E75' : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              {asp.label}
            </button>
          ))}
        </div>

        {/* フォームカード */}
        {userId && (
          <AspForm key={activeTab} userId={userId} asp={activeAsp} />
        )}
      </div>
    </div>
  )
}

function AspForm({ userId, asp }: { userId: string; asp: AspConfig }) {
  const supabase = createClient()
  const [fields, setFields] = useState<{ api_key: string; api_secret: string }>({ api_key: '', api_secret: '' })
  const [credLoaded, setCredLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [syncMsg, setSyncMsg] = useState('')
  const [earnings, setEarnings] = useState<Earning[]>([])
  useEffect(() => {
    supabase
      .from('asp_credentials')
      .select('api_key, api_secret')
      .eq('user_id', userId)
      .eq('asp_name', asp.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setFields({ api_key: data.api_key ?? '', api_secret: data.api_secret ?? '' })
        setCredLoaded(true)
      })
    loadEarnings()
  }, [])

  const loadEarnings = async () => {
    const { data } = await supabase
      .from('asp_earnings')
      .select('month, earnings, click_count, cv_count')
      .eq('user_id', userId)
      .eq('asp_name', asp.id)
      .order('month', { ascending: false })
      .limit(6)
    if (data) setEarnings(data)
  }

  const handleSave = async () => {
    if (!fields.api_key.trim()) { setSaveMsg('APIキーを入力してください'); return }
    setSaving(true)
    setSaveMsg('')
    const { error } = await supabase
      .from('asp_credentials')
      .upsert(
        { user_id: userId, asp_name: asp.id, api_key: fields.api_key.trim(), api_secret: fields.api_secret.trim() },
        { onConflict: 'user_id,asp_name' }
      )
    setSaving(false)
    setSaveMsg(error ? `エラー: ${error.message}` : '保存しました')
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncMsg('')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setSyncMsg('認証エラーです'); setSyncing(false); return }

    const res = await fetch(asp.apiPath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({}),
    })
    const json = await res.json()
    setSyncing(false)
    if (!res.ok) {
      setSyncMsg(`エラー: ${json.error ?? '不明なエラー'}`)
    } else {
      setSyncMsg(`同期完了 — ¥${Number(json.total_earnings).toLocaleString()} (CV ${json.cv_count}件)`)
      loadEarnings()
    }
  }

  const hasKey = fields.api_key.trim().length > 0

  const formatMonth = (month: string) => {
    const d = new Date(month)
    return `${d.getFullYear()}年${d.getMonth() + 1}月`
  }

  return (
    <>
      {/* 設定カード */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ width: '36px', height: '36px', background: asp.color, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#fff', textAlign: 'center', lineHeight: 1.2 }}>
              {asp.label.slice(0, 2)}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>{asp.label}</div>
            <div style={{ fontSize: '11px', color: '#888' }}>APIキーを入力して連携</div>
          </div>
          {credLoaded && hasKey && (
            <div style={{ marginLeft: 'auto', background: '#E1F5EE', color: '#085041', fontSize: '11px', fontWeight: '500', padding: '3px 10px', borderRadius: '20px' }}>
              連携済み
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          {asp.fields.map(f => (
            <div key={f.key}>
              <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '6px' }}>{f.label}</label>
              <input
                type={f.type}
                value={fields[f.key]}
                onChange={e => setFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                style={{ width: '100%', padding: '9px 12px', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '9px 20px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? '保存中...' : '保存'}
          </button>
          <button
            onClick={handleSync}
            disabled={syncing || !hasKey}
            style={{
              padding: '9px 20px', border: '1px solid', borderRadius: '8px', fontSize: '13px', fontWeight: '500',
              cursor: syncing || !hasKey ? 'not-allowed' : 'pointer',
              background: syncing || !hasKey ? '#f5f5f5' : '#fff',
              color: syncing || !hasKey ? '#bbb' : '#1D9E75',
              borderColor: syncing || !hasKey ? '#e0e0e0' : '#1D9E75',
            }}
          >
            {syncing ? '同期中...' : '収益を同期'}
          </button>
          {saveMsg && (
            <span style={{ fontSize: '12px', color: saveMsg.startsWith('エラー') ? '#e53e3e' : '#1D9E75' }}>{saveMsg}</span>
          )}
          {syncMsg && (
            <span style={{ fontSize: '12px', color: syncMsg.startsWith('エラー') ? '#e53e3e' : '#1D9E75' }}>{syncMsg}</span>
          )}
        </div>

        <div style={{ marginTop: '12px', padding: '10px 14px', background: '#f9f9f9', borderRadius: '8px', fontSize: '11px', color: '#888', lineHeight: 1.6 }}>
          {asp.helpText}
        </div>
      </div>

      {/* 収益履歴 */}
      {earnings.length > 0 ? (
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: '12px', padding: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {asp.label} 収益履歴
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                {['月', '収益（確定）', 'CV数', 'クリック数'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '11px', color: '#888', fontWeight: '400', borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {earnings.map((e, i) => (
                <tr key={i}>
                  <td style={{ padding: '10px 12px', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>{formatMonth(e.month)}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '0.5px solid rgba(0,0,0,0.06)', fontWeight: '500', color: '#1D9E75' }}>¥{Number(e.earnings).toLocaleString()}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '0.5px solid rgba(0,0,0,0.06)', color: '#555' }}>{e.cv_count}件</td>
                  <td style={{ padding: '10px 12px', borderBottom: '0.5px solid rgba(0,0,0,0.06)', color: '#555' }}>{(e.click_count ?? 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '6px' }}>収益データがありません</div>
          <div style={{ fontSize: '12px', color: '#ccc' }}>APIキーを保存して「収益を同期」を押してください</div>
        </div>
      )}
    </>
  )
}
