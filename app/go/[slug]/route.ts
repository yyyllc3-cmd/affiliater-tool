import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('short_links')
    .select('id, original_url, click_count')
    .eq('slug', slug)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // クリック数をインクリメント
  await supabase
    .from('short_links')
    .update({ click_count: (data.click_count || 0) + 1 })
    .eq('id', data.id)

  return NextResponse.redirect(data.original_url, { status: 302 })
}
