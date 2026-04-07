import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const { data: creds } = await supabase
    .from('asp_credentials')
    .select('api_key, api_secret')
    .eq('user_id', user.id)
    .eq('asp_name', 'moshimo')
    .maybeSingle()

  if (!creds) {
    return NextResponse.json({ error: 'もしもアフィリエイトの認証情報が設定されていません' }, { status: 400 })
  }

  // TODO: もしもアフィリエイト APIの実装
  // アカウント取得後に実装予定
  return NextResponse.json({ error: 'もしもアフィリエイトのAPI連携は準備中です' }, { status: 501 })
}
