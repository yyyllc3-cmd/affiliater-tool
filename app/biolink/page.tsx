'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useIsPro } from '@/lib/useIsPro'

const FREE_LINK_LIMIT = 3
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type BioLink = {
  id: string
  title: string
  url: string
  display_order: number
  click_count: number
  is_active: boolean
}

// ドラッグ可能な1件分のリンクアイテム
function SortableItem({
  link,
  onToggle,
  onDelete,
}: {
  link: BioLink
  onToggle: (id: string, current: boolean) => void
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: link.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : link.is_active ? 1 : 0.5,
    background: isDragging ? '#f0faf5' : '#fff',
    border: isDragging ? '0.5px solid #1D9E75' : '0.5px solid rgba(0,0,0,0.1)',
    borderRadius: '12px',
    padding: '14px 16px',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: isDragging ? '0 4px 16px rgba(0,0,0,0.12)' : 'none',
    zIndex: isDragging ? 1 : 'auto',
    position: 'relative' as const,
  }

  return (
    <div ref={setNodeRef} style={style}>
      {/* ドラッグハンドル */}
      <div
        {...attributes}
        {...listeners}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', color: '#ccc', padding: '0 4px', flexShrink: 0, touchAction: 'none' }}
      >
        ⠿
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '2px' }}>{link.title}</div>
        <div style={{ fontSize: '11px', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.url}</div>
        <div style={{ fontSize: '11px', color: '#1D9E75', marginTop: '2px' }}>クリック数：{link.click_count}</div>
      </div>

      <button
        onClick={() => onToggle(link.id, link.is_active)}
        style={{ fontSize: '11px', padding: '5px 10px', borderRadius: '6px', border: '0.5px solid rgba(0,0,0,0.15)', background: link.is_active ? '#E1F5EE' : '#f5f5f0', color: link.is_active ? '#085041' : '#888', cursor: 'pointer', whiteSpace: 'nowrap' }}
      >
        {link.is_active ? '公開中' : '非公開'}
      </button>
      <button
        onClick={() => onDelete(link.id)}
        style={{ fontSize: '11px', padding: '5px 10px', borderRadius: '6px', border: '0.5px solid rgba(0,0,0,0.15)', background: 'transparent', color: '#A32D2D', cursor: 'pointer' }}
      >
        削除
      </button>
    </div>
  )
}

type ClickRank = {
  link_id: string
  title: string
  count: number
  rate: number
}

export default function BioLinkPage() {
  const [links, setLinks] = useState<BioLink[]>([])
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState('')
  const [ranking, setRanking] = useState<ClickRank[]>([])
  const router = useRouter()
  const supabase = createClient()
  const isPro = useIsPro()
  const atLimit = !isPro && links.length >= FREE_LINK_LIMIT

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      fetchLinks(user.id)
      fetchRanking(user.id)
    })
  }, [])

  const fetchRanking = async (uid: string) => {
    const { data: clicks } = await supabase
      .from('link_clicks')
      .select('link_id')
      .eq('user_id', uid)
    const { data: bioLinks } = await supabase
      .from('bio_links')
      .select('id, title')
      .eq('user_id', uid)
    if (!clicks || !bioLinks) return

    const counts: Record<string, number> = {}
    clicks.forEach(c => { if (c.link_id) counts[c.link_id] = (counts[c.link_id] || 0) + 1 })
    const total = clicks.length || 1
    const ranked = bioLinks
      .map(l => ({ link_id: l.id, title: l.title, count: counts[l.id] || 0, rate: Math.round(((counts[l.id] || 0) / total) * 100) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    setRanking(ranked)
  }

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
    if (atLimit) return
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = links.findIndex(l => l.id === active.id)
    const newIndex = links.findIndex(l => l.id === over.id)
    const reordered = arrayMove(links, oldIndex, newIndex)

    // UIを即時更新
    setLinks(reordered)

    // Supabaseに保存（display_orderを更新）
    await Promise.all(
      reordered.map((link, index) =>
        supabase
          .from('bio_links')
          .update({ display_order: index })
          .eq('id', link.id)
      )
    )
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
        {atLimit ? (
          <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '8px', padding: '12px 14px', fontSize: '12px', color: '#92400E', marginBottom: '4px' }}>
            無料プランはリンクを{FREE_LINK_LIMIT}件まで登録できます。
            <button onClick={async () => { const { data: { session } } = await supabase.auth.getSession(); if (!session) return; const res = await fetch('/api/stripe/checkout', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` } }); const { url } = await res.json(); if (url) window.location.href = url }} style={{ marginLeft: '8px', color: '#1D9E75', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Proにアップグレード →</button>
          </div>
        ) : (
          <button
            onClick={addLink}
            disabled={loading || !title || !url}
            style={{ width: '100%', padding: '10px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: loading || !title || !url ? 'not-allowed' : 'pointer', opacity: loading || !title || !url ? 0.6 : 1 }}
          >
            {loading ? '追加中...' : '追加する'}
          </button>
        )}
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '2px' }}>
          登録済みリンク（{links.length}件{!isPro ? ` / 無料プラン上限 ${FREE_LINK_LIMIT}件` : ''}）
        </div>
        <div style={{ fontSize: '11px', color: '#888' }}>⠿ アイコンをドラッグして並び替えできます</div>
      </div>

      {ranking.length > 0 && (
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '12px' }}>クリック率ランキング</div>
          {ranking.map((item, i) => {
            const medals = ['🥇', '🥈', '🥉']
            const medal = medals[i] ?? `${i + 1}.`
            return (
              <div key={item.link_id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: i < ranking.length - 1 ? '0.5px solid rgba(0,0,0,0.06)' : 'none' }}>
                <span style={{ fontSize: '18px', width: '24px', textAlign: 'center', flexShrink: 0 }}>{medal}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                  <div style={{ height: '4px', background: '#f0f0f0', borderRadius: '2px', marginTop: '4px' }}>
                    <div style={{ height: '100%', width: `${item.rate}%`, background: '#1D9E75', borderRadius: '2px', transition: 'width 0.3s' }} />
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#1D9E75' }}>{item.count}回</div>
                  <div style={{ fontSize: '10px', color: '#aaa' }}>{item.rate}%</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {links.length === 0 ? (
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#aaa', fontSize: '13px' }}>
          リンクがまだありません。上から追加してください。
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={links.map(l => l.id)} strategy={verticalListSortingStrategy}>
            {links.map(link => (
              <SortableItem
                key={link.id}
                link={link}
                onToggle={toggleActive}
                onDelete={deleteLink}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
