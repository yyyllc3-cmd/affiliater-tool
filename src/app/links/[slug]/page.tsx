'use client'

import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LinksPage({ params }: { params: { slug: string } }) {
  const [links, setLinks] = useState<any[]>([])
  const [debug, setDebug] = useState<string>('loading...')

  useEffect(() => {
    async function fetchLinks() {
      const slug = params.slug
      const { data: d1, error: e1 } = await supabase.from('bio_links').select('*')
      const { data: d2, error: e2 } = await supabase.rpc('get_links_by_slug', { slug })
      setDebug(`slug=${slug} | 全件=${JSON.stringify(d1)} | rpc=${JSON.stringify(d2)} | err=${JSON.stringify(e2)}`)
      if (d2) setLinks(d2)
    }
    fetchLinks()
  }, [])

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
      <h1>リンク一覧</h1>
      <p style={{ fontSize: '0.6rem', color: '#999', wordBreak: 'break-all' }}>{debug}</p>
      {links.map((link: any) => (
        <a key={link.id} href={link.url} style={{ display: 'block', padding: '1rem', margin: '0.5rem', background: '#fff', borderRadius: 8, textDecoration: 'none', color: '#333' }}>
          {link.title}
        </a>
      ))}
    </div>
  )
}
