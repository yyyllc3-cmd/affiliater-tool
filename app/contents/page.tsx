'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// ── 型定義 ──────────────────────────────────────────
type BlogPost = {
  id: string
  title: string
  body: string
  tags: string[]
  status: 'draft' | 'published'
  created_at: string
}

type SnsDraft = {
  id: string
  platform: 'x' | 'instagram' | 'threads'
  body: string
  created_at: string
}

type ShortLink = {
  id: string
  slug: string
  original_url: string
}

type Review = {
  id: string
  title: string
  body: string
  rating: number
  short_link_id: string | null
  created_at: string
}

const PLATFORM_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  x:         { label: 'X (Twitter)', color: '#1a1a1a', icon: '𝕏' },
  instagram: { label: 'Instagram',   color: '#e1306c', icon: '📸' },
  threads:   { label: 'Threads',     color: '#000',    icon: '🧵' },
}

const SIDEBAR_MENUS = [
  { id: 'dashboard',  label: '収益ダッシュボード', path: '/dashboard' },
  { id: 'biolink',    label: 'bioリンク管理',     path: '/biolink' },
  { id: 'contents',  label: 'コンテンツ管理',     path: '/contents' },
  { id: 'asp',       label: 'ASP連携',            path: '/asp' },
  { id: 'shortlink', label: '短縮リンク',         path: '/shortlink' },
  { id: 'profile',   label: 'プロフィール設定',   path: '/profile' },
]

// ── ユーティリティ ──────────────────────────────────
function formatDate(s: string) {
  const d = new Date(s)
  return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`
}

// ── 共通スタイル ────────────────────────────────────
const card = { background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: '12px', padding: '24px', marginBottom: '16px' }
const inputStyle = { width: '100%', padding: '9px 12px', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' }
const labelStyle = { fontSize: '12px', color: '#555', display: 'block' as const, marginBottom: '6px' }
const btnGreen = { padding: '9px 20px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500' as const, cursor: 'pointer' }
const btnGray  = { padding: '9px 16px', background: 'transparent', color: '#888', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }
const btnRed   = { padding: '6px 12px', background: 'transparent', color: '#A32D2D', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }

// ══════════════════════════════════════════════════
// ブログ記事タブ
// ══════════════════════════════════════════════════
function BlogTab({ userId }: { userId: string }) {
  const supabase = createClient()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [editing, setEditing] = useState<BlogPost | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tags, setTags] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { fetchPosts() }, [])

  const fetchPosts = async () => {
    const { data } = await supabase.from('blog_posts').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    if (data) setPosts(data)
  }

  const resetForm = () => { setTitle(''); setBody(''); setTags(''); setStatus('draft'); setEditing(null); setMsg('') }

  const startEdit = (p: BlogPost) => { setEditing(p); setTitle(p.title); setBody(p.body || ''); setTags((p.tags || []).join(', ')); setStatus(p.status) }

  const handleSave = async () => {
    if (!title.trim()) { setMsg('タイトルを入力してください'); return }
    setSaving(true); setMsg('')
    const payload = { user_id: userId, title: title.trim(), body, tags: tags.split(',').map(t => t.trim()).filter(Boolean), status, updated_at: new Date().toISOString() }
    if (editing) {
      await supabase.from('blog_posts').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('blog_posts').insert(payload)
    }
    setSaving(false); resetForm(); fetchPosts()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('削除しますか？')) return
    await supabase.from('blog_posts').delete().eq('id', id)
    fetchPosts()
  }

  return (
    <div>
      {/* フォーム */}
      <div style={card}>
        <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '16px' }}>{editing ? '記事を編集' : '新しい記事を作成'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={labelStyle}>タイトル</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="記事タイトル" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>本文</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="記事の本文を入力..." rows={6}
              style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div>
            <label style={labelStyle}>タグ（カンマ区切り）</label>
            <input value={tags} onChange={e => setTags(e.target.value)} placeholder="例: アフィリエイト, レビュー, ガジェット" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>ステータス</label>
            <select value={status} onChange={e => setStatus(e.target.value as 'draft' | 'published')}
              style={{ ...inputStyle, width: 'auto', paddingRight: '32px' }}>
              <option value="draft">下書き</option>
              <option value="published">公開</option>
            </select>
          </div>
        </div>
        {msg && <div style={{ fontSize: '12px', color: '#e53e3e', marginTop: '8px' }}>{msg}</div>}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button onClick={handleSave} disabled={saving} style={{ ...btnGreen, opacity: saving ? 0.6 : 1 }}>
            {saving ? '保存中...' : editing ? '更新する' : '保存する'}
          </button>
          {editing && <button onClick={resetForm} style={btnGray}>キャンセル</button>}
        </div>
      </div>

      {/* 記事一覧 */}
      <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '12px' }}>記事一覧（{posts.length}件）</div>
      {posts.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', color: '#aaa', fontSize: '13px' }}>記事がまだありません</div>
      ) : posts.map(p => (
        <div key={p.id} style={{ ...card, marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a' }}>{p.title}</span>
                <span style={{ fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '4px', background: p.status === 'published' ? '#E1F5EE' : '#f3f4f6', color: p.status === 'published' ? '#085041' : '#888' }}>
                  {p.status === 'published' ? '公開中' : '下書き'}
                </span>
              </div>
              {p.body && <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' }}>{p.body}</div>}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                {(p.tags || []).map(t => <span key={t} style={{ fontSize: '10px', background: '#f0fdf9', color: '#1D9E75', padding: '2px 8px', borderRadius: '4px' }}>{t}</span>)}
                <span style={{ fontSize: '10px', color: '#ccc' }}>{formatDate(p.created_at)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              <button onClick={() => startEdit(p)} style={btnGray}>編集</button>
              <button onClick={() => handleDelete(p.id)} style={btnRed}>削除</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════
// SNS投稿タブ
// ══════════════════════════════════════════════════
function SnsTab({ userId }: { userId: string }) {
  const supabase = createClient()
  const [drafts, setDrafts] = useState<SnsDraft[]>([])
  const [editing, setEditing] = useState<SnsDraft | null>(null)
  const [platform, setPlatform] = useState<'x' | 'instagram' | 'threads'>('x')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchDrafts() }, [])

  const fetchDrafts = async () => {
    const { data } = await supabase.from('sns_drafts').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    if (data) setDrafts(data)
  }

  const resetForm = () => { setBody(''); setPlatform('x'); setEditing(null) }

  const startEdit = (d: SnsDraft) => { setEditing(d); setPlatform(d.platform); setBody(d.body) }

  const handleSave = async () => {
    if (!body.trim()) return
    setSaving(true)
    const payload = { user_id: userId, platform, body: body.trim(), updated_at: new Date().toISOString() }
    if (editing) {
      await supabase.from('sns_drafts').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('sns_drafts').insert(payload)
    }
    setSaving(false); resetForm(); fetchDrafts()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('削除しますか？')) return
    await supabase.from('sns_drafts').delete().eq('id', id)
    fetchDrafts()
  }

  const charLimit = platform === 'x' ? 280 : 2200

  return (
    <div>
      {/* フォーム */}
      <div style={card}>
        <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '16px' }}>{editing ? '投稿を編集' : '新しい下書きを作成'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={labelStyle}>プラットフォーム</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(Object.keys(PLATFORM_LABELS) as ('x' | 'instagram' | 'threads')[]).map(p => (
                <button key={p} onClick={() => setPlatform(p)}
                  style={{ padding: '8px 16px', border: `1.5px solid ${platform === p ? PLATFORM_LABELS[p].color : '#e5e7eb'}`, borderRadius: '8px', background: platform === p ? '#f9f9f9' : 'transparent', fontSize: '12px', fontWeight: platform === p ? '600' : '400', cursor: 'pointer', color: platform === p ? PLATFORM_LABELS[p].color : '#888' }}>
                  {PLATFORM_LABELS[p].icon} {PLATFORM_LABELS[p].label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>投稿文</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} placeholder={`${PLATFORM_LABELS[platform].label}用の投稿文を入力...`} rows={5}
              style={{ ...inputStyle, resize: 'vertical' }} />
            <div style={{ fontSize: '11px', color: body.length > charLimit ? '#e53e3e' : '#aaa', textAlign: 'right', marginTop: '4px' }}>{body.length} / {charLimit}文字</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button onClick={handleSave} disabled={saving || !body.trim()} style={{ ...btnGreen, opacity: saving || !body.trim() ? 0.6 : 1 }}>
            {saving ? '保存中...' : editing ? '更新する' : '下書き保存'}
          </button>
          {editing && <button onClick={resetForm} style={btnGray}>キャンセル</button>}
        </div>
      </div>

      {/* 下書き一覧 */}
      <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '12px' }}>下書き一覧（{drafts.length}件）</div>
      {drafts.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', color: '#aaa', fontSize: '13px' }}>下書きがまだありません</div>
      ) : drafts.map(d => (
        <div key={d.id} style={{ ...card, marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: PLATFORM_LABELS[d.platform].color }}>{PLATFORM_LABELS[d.platform].icon} {PLATFORM_LABELS[d.platform].label}</span>
                <span style={{ fontSize: '10px', color: '#ccc' }}>{formatDate(d.created_at)}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#555', whiteSpace: 'pre-wrap', lineHeight: 1.6, maxHeight: '80px', overflow: 'hidden' }}>{d.body}</div>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              <button onClick={() => startEdit(d)} style={btnGray}>編集</button>
              <button onClick={() => handleDelete(d.id)} style={btnRed}>削除</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════
// レビュータブ
// ══════════════════════════════════════════════════
function ReviewTab({ userId }: { userId: string }) {
  const supabase = createClient()
  const [reviews, setReviews] = useState<Review[]>([])
  const [shortLinks, setShortLinks] = useState<ShortLink[]>([])
  const [editing, setEditing] = useState<Review | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [rating, setRating] = useState(5)
  const [shortLinkId, setShortLinkId] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { fetchReviews(); fetchShortLinks() }, [])

  const fetchReviews = async () => {
    const { data } = await supabase.from('affiliate_reviews').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    if (data) setReviews(data)
  }

  const fetchShortLinks = async () => {
    const { data } = await supabase.from('short_links').select('id, slug, original_url').eq('user_id', userId)
    if (data) setShortLinks(data)
  }

  const resetForm = () => { setTitle(''); setBody(''); setRating(5); setShortLinkId(''); setEditing(null); setMsg('') }

  const startEdit = (r: Review) => { setEditing(r); setTitle(r.title); setBody(r.body || ''); setRating(r.rating || 5); setShortLinkId(r.short_link_id || '') }

  const handleSave = async () => {
    if (!title.trim()) { setMsg('タイトルを入力してください'); return }
    setSaving(true); setMsg('')
    const payload = { user_id: userId, title: title.trim(), body, rating, short_link_id: shortLinkId || null, updated_at: new Date().toISOString() }
    if (editing) {
      await supabase.from('affiliate_reviews').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('affiliate_reviews').insert(payload)
    }
    setSaving(false); resetForm(); fetchReviews()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('削除しますか？')) return
    await supabase.from('affiliate_reviews').delete().eq('id', id)
    fetchReviews()
  }

  const stars = (n: number, size = 16) => Array.from({ length: 5 }, (_, i) => (
    <span key={i} style={{ fontSize: `${size}px`, color: i < n ? '#F59E0B' : '#e5e7eb' }}>★</span>
  ))

  return (
    <div>
      {/* フォーム */}
      <div style={card}>
        <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '16px' }}>{editing ? 'レビューを編集' : '新しいレビューを作成'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={labelStyle}>タイトル</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="商品・サービス名" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>レビュー本文</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="詳細なレビューを入力..." rows={5}
              style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div>
            <label style={labelStyle}>評価</label>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setRating(n)}
                  style={{ fontSize: '28px', background: 'none', border: 'none', cursor: 'pointer', color: n <= rating ? '#F59E0B' : '#e5e7eb', padding: '0 2px', lineHeight: 1 }}>
                  ★
                </button>
              ))}
              <span style={{ fontSize: '12px', color: '#888', alignSelf: 'center', marginLeft: '8px' }}>{rating}/5</span>
            </div>
          </div>
          <div>
            <label style={labelStyle}>アフィリエイトリンクと紐づけ（任意）</label>
            <select value={shortLinkId} onChange={e => setShortLinkId(e.target.value)}
              style={{ ...inputStyle, width: 'auto', minWidth: '240px', paddingRight: '32px' }}>
              <option value="">リンクを選択しない</option>
              {shortLinks.map(l => (
                <option key={l.id} value={l.id}>/go/{l.slug}</option>
              ))}
            </select>
          </div>
        </div>
        {msg && <div style={{ fontSize: '12px', color: '#e53e3e', marginTop: '8px' }}>{msg}</div>}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button onClick={handleSave} disabled={saving} style={{ ...btnGreen, opacity: saving ? 0.6 : 1 }}>
            {saving ? '保存中...' : editing ? '更新する' : '保存する'}
          </button>
          {editing && <button onClick={resetForm} style={btnGray}>キャンセル</button>}
        </div>
      </div>

      {/* レビュー一覧 */}
      <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '12px' }}>レビュー一覧（{reviews.length}件）</div>
      {reviews.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', color: '#aaa', fontSize: '13px' }}>レビューがまだありません</div>
      ) : reviews.map(r => (
        <div key={r.id} style={{ ...card, marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '4px' }}>{r.title}</div>
              <div style={{ marginBottom: '6px' }}>{stars(r.rating)}</div>
              {r.body && <div style={{ fontSize: '12px', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px', marginBottom: '4px' }}>{r.body}</div>}
              {r.short_link_id && (
                <div style={{ fontSize: '11px', color: '#1D9E75' }}>
                  🔗 {shortLinks.find(l => l.id === r.short_link_id)?.slug ? `/go/${shortLinks.find(l => l.id === r.short_link_id)?.slug}` : '紐づきリンクあり'}
                </div>
              )}
              <div style={{ fontSize: '10px', color: '#ccc', marginTop: '4px' }}>{formatDate(r.created_at)}</div>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              <button onClick={() => startEdit(r)} style={btnGray}>編集</button>
              <button onClick={() => handleDelete(r.id)} style={btnRed}>削除</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════
// メインページ
// ══════════════════════════════════════════════════
export default function ContentsPage() {
  const [userId, setUserId] = useState('')
  const [activeTab, setActiveTab] = useState<'blog' | 'sns' | 'review'>('blog')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
    })
  }, [])

  const tabs = [
    { id: 'blog',   label: '📝 ブログ記事' },
    { id: 'sns',    label: '📱 SNS投稿' },
    { id: 'review', label: '⭐ レビュー記事' },
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
          {SIDEBAR_MENUS.map(m => (
            <button key={m.id} onClick={() => router.push(m.path)}
              style={{ width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', marginBottom: '2px',
                background: m.id === 'contents' ? '#E1F5EE' : 'transparent',
                color: m.id === 'contents' ? '#085041' : '#555',
                fontWeight: m.id === 'contents' ? '500' : '400' }}>
              {m.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '500', margin: '0 0 4px', color: '#1a1a1a' }}>コンテンツ管理</h2>
        <p style={{ fontSize: '13px', color: '#888', margin: '0 0 24px' }}>ブログ記事・SNS投稿・レビュー記事を管理できます</p>

        {/* タブ */}
        <div style={{ display: 'flex', gap: '4px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', marginBottom: '24px' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as typeof activeTab)}
              style={{ padding: '8px 20px', border: 'none', cursor: 'pointer', fontSize: '13px', background: 'transparent',
                color: activeTab === t.id ? '#1a1a1a' : '#999',
                fontWeight: activeTab === t.id ? '500' : '400',
                borderBottom: activeTab === t.id ? '2px solid #1D9E75' : '2px solid transparent',
                marginBottom: '-1px' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* タブコンテンツ */}
        {userId && activeTab === 'blog'   && <BlogTab   userId={userId} />}
        {userId && activeTab === 'sns'    && <SnsTab    userId={userId} />}
        {userId && activeTab === 'review' && <ReviewTab userId={userId} />}
      </div>
    </div>
  )
}
