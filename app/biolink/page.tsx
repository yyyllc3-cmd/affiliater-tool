'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type BioLink = {
  id: string
  title: string
  url: string
  display_order: number
  click_count: number
  is_active: boolean
}

export default function BioLinkPage() {
  const [links, setLinks] = useState<BioLink[]>([])
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      fetchLinks(user.id)
    })
  }, [])

  const fetchLinks = async (uid: string) => {
    const { data } = await supabase
      .from('bio_links')
      .select('*')
      .eq('user_id', uid)
      .order('display_order')
    if (data) setLinks(data)
  }

  const addLink = async () => {
    if (!title || !url || !userId) return
    setLoading(true)
    const { error } = await supabase.from('bio_links').insert({
      user_id: userId,
      title,
      url: url.startsWith('http') ? url : 'https://' + url,
      display_order: links.length,
    is_active: true,
    })
    if (!error) {
      setTitle('')
      setUrl('')
      fetchLinks(userId)
    }
    setLoading(false)
  }

  const deleteLink = async (id: string) => {
    await supabase.from('bio_links').delete().eq('id', id)
    fetchLinks(userId)
  }

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('bio_links').update({ is_active: !current }).eq('id', id)
    fetchLinks(userId)
  }

  return (
    <div style={{ minHeight: '100vh', padding: '32px 16px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: '500', margin: '0 0 4px', color: '#1a1a1a' }}>bioリンク管理</h1>
          <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>Instagramのプロフィールに貼るリンクを管理します</p>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '8px', border: '0.5px solid rgba(0,0,0,0.15)', background: 'transparent', cursor: 'pointer', color: '#555' }}
        >
          ダッシュボードへ
        </button>
      </div>

      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '12px', color: '#1a1a1a' }}>リンクを追加</div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '5px' }}>タイトル</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="例：ブログ記事一覧"
            style={{ width: '100%', padding: '9px 12px', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '5px' }}>URL</label>
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="例：https://yourblog.com"
            style={{ width: '100%', padding: '9px 12px', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <button
          onClick={addLink}
          disabled={loading || !title || !url}
          style={{ width: '100%', padding: '10px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: loading || !title || !url ? 'not-allowed' : 'pointer', opacity: loading || !title || !url ? 0.6 : 1 }}
        >
          {loading ? '追加中...' : '追加する'}
        </button>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '2px' }}>登録済みリンク（{links.length}件）</div>
        <div style={{ fontSize: '11px', color: '#888' }}>公開URL：affiliater-tool.vercel.app/links/{userId.slice(0, 8)}</div>
      </div>

      {links.length === 0 ? (
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#aaa', fontSize: '13px' }}>
          リンクがまだありません。上から追加してください。
        </div>
      ) : (
        links.map(link => (
          <div key={link.id} style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: '12px', padding: '14px 16px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px', opacity: link.is_active ? 1 : 0.5 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '2px' }}>{link.title}</div>
              <div style={{ fontSize: '11px', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.url}</div>
              <div style={{ fontSize: '11px', color: '#1D9E75', marginTop: '2px' }}>クリック数：{link.click_count}</div>
            </div>
            <button
              onClick={() => toggleActive(link.id, link.is_active)}
              style={{ fontSize: '11px', padding: '5px 10px', borderRadius: '6px', border: '0.5px solid rgba(0,0,0,0.15)', background: link.is_active ? '#E1F5EE' : '#f5f5f0', color: link.is_active ? '#085041' : '#888', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {link.is_active ? '公開中' : '非公開'}
            </button>
            <button
              onClick={() => deleteLink(link.id)}
              style={{ fontSize: '11px', padding: '5px 10px', borderRadius: '6px', border: '0.5px solid rgba(0,0,0,0.15)', background: 'transparent', color: '#A32D2D', cursor: 'pointer' }}
            >
              削除
            </button>
          </div>
        ))
      )}
    </div>
  )
}
