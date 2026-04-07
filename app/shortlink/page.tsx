'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type ShortLink = {
  id: string
  slug: string
  original_url: string
  click_count: number
  created_at: string
}

export default function ShortLinkPage() {
  const [links, setLinks] = useState<ShortLink[]>([])
  const [slug, setSlug] = useState('')
  const [originalUrl, setOriginalUrl] = useState('')
  const [userId, setUserId] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [origin, setOrigin] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setOrigin(window.location.origin)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      fetchLinks(user.id)
    })
  }, [])

  const fetchLinks = async (uid: string) => {
    const { data } = await supabase
      .from('short_links')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    if (data) setLinks(data)
  }

  const handleAdd = async () => {
    if (!slug.trim() || !originalUrl.trim() || !userId) return
    setSaving(true)
    setMsg('')
    const { error } = await supabase.from('short_links').insert({
      user_id: userId,
      slug: slug.trim(),
      original_url: originalUrl.startsWith('http') ? originalUrl.trim() : 'https://' + originalUrl.trim(),
    })
    setSaving(false)
    if (error) {
      setMsg(error.message.includes('unique') ? 'このスラッグはすでに使われています' : `エラー: ${error.message}`)
    } else {
      setSlug('')
      setOriginalUrl('')
      setMsg('作成しました')
      fetchLinks(userId)
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('short_links').delete().eq('id', id)
    fetchLinks(userId)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const menus = [
    { id: 'dashboard', label: '収益ダッシュボード', path: '/dashboard' },
    { id: 'biolink', label: 'bioリンク管理', path: '/biolink' },
    { id: 'contents', label: 'コンテンツ管理' },
    { id: 'asp', label: 'ASP連携', path: '/asp' },
    { id: 'shortlink', label: '短縮リンク', path: '/shortlink' },
    { id: 'profile', label: 'プロフィール設定', path: '/profile' },
  ]

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
                background: m.id === 'shortlink' ? '#E1F5EE' : 'transparent',
                color: m.id === 'shortlink' ? '#085041' : '#555',
                fontWeight: m.id === 'shortlink' ? '500' : '400',
              }}
            >
              {m.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '500', margin: '0 0 4px', color: '#1a1a1a' }}>短縮リンク</h2>
        <p style={{ fontSize: '13px', color: '#888', margin: '0 0 24px' }}>アフィリエイトURLを短縮して管理できます</p>

        {/* 作成フォーム */}
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '16px' }}>新しい短縮リンクを作成</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '6px' }}>スラッグ（短縮後のパス）</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#888', whiteSpace: 'nowrap' }}>{origin}/go/</span>
                <input
                  value={slug}
                  onChange={e => setSlug(e.target.value.replace(/[^a-zA-Z0-9\-_]/g, ''))}
                  placeholder="amazon"
                  style={{ flex: 1, padding: '9px 12px', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '6px' }}>転送先URL（アフィリエイトURL）</label>
              <input
                value={originalUrl}
                onChange={e => setOriginalUrl(e.target.value)}
                placeholder="https://www.amazon.co.jp/..."
                style={{ width: '100%', padding: '9px 12px', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={handleAdd}
              disabled={saving || !slug || !originalUrl}
              style={{ padding: '9px 20px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: saving || !slug || !originalUrl ? 'not-allowed' : 'pointer', opacity: saving || !slug || !originalUrl ? 0.6 : 1 }}
            >
              {saving ? '作成中...' : '作成する'}
            </button>
            {msg && <span style={{ fontSize: '12px', color: msg.startsWith('エラー') || msg.includes('すでに') ? '#e53e3e' : '#1D9E75' }}>{msg}</span>}
          </div>
        </div>

        {/* リンク一覧 */}
        {links.length === 0 ? (
          <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: '#aaa' }}>短縮リンクがまだありません</div>
          </div>
        ) : (
          <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: '12px', padding: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '16px' }}>作成済みリンク（{links.length}件）</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  {['短縮URL', '転送先', 'クリック数', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '11px', color: '#888', fontWeight: '400', borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {links.map(link => (
                  <tr key={link.id}>
                    <td style={{ padding: '10px 12px', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontFamily: 'monospace', color: '#1D9E75', fontSize: '12px' }}>/go/{link.slug}</span>
                        <button
                          onClick={() => copyToClipboard(`${origin}/go/${link.slug}`)}
                          style={{ fontSize: '10px', padding: '2px 6px', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: '4px', background: 'transparent', cursor: 'pointer', color: '#888' }}
                        >
                          コピー
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '0.5px solid rgba(0,0,0,0.06)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#888', fontSize: '12px' }}>
                      {link.original_url}
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '0.5px solid rgba(0,0,0,0.06)', color: '#1D9E75', fontWeight: '500' }}>
                      {link.click_count}回
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                      <button
                        onClick={() => handleDelete(link.id)}
                        style={{ fontSize: '11px', padding: '4px 10px', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: '6px', background: 'transparent', color: '#A32D2D', cursor: 'pointer' }}
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
