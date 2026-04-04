'use client'
import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase'

type BioLink = {
  id: string
  title: string
  url: string
  click_count: number
  is_active: boolean
  user_id: string
}

export default function PublicBioPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const [links, setLinks] = useState<BioLink[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchLinks = async () => {
      const { data, error } = await supabase
        .rpc('get_links_by_slug', { slug: userId })

      console.log('userId:', userId, 'data:', data, 'error:', error)
      if (data) setLinks(data.filter((l: BioLink) => l.is_active))
      setLoading(false)
    }
    fetchLinks()
  }, [userId])

  const handleClick = async (link: BioLink) => {
    await supabase
      .from('bio_links')
      .update({ click_count: link.click_count + 1 })
      .eq('id', link.id)
    window.open(link.url, '_blank')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '13px', color: '#888' }}>読み込み中...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', padding: '48px 16px', maxWidth: '480px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ width: '64px', height: '64px', background: '#1D9E75', borderRadius: '16px', margin: '0 auto 12px' }}></div>
        <div style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a' }}>リンク一覧</div>
      </div>
      {links.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#aaa', fontSize: '13px' }}>リンクはまだありません</div>
      ) : (
        links.map(link => (
          <button
            key={link.id}
            onClick={() => handleClick(link)}
            style={{ width: '100%', padding: '16px', background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: '12px', marginBottom: '10px', fontSize: '14px', fontWeight: '500', color: '#1a1a1a', cursor: 'pointer', textAlign: 'center', display: 'block' }}
          >
            {link.title}
          </button>
        ))
      )}
    </div>
  )
}
