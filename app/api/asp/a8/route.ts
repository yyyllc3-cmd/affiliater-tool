import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// A8.net XML から数値タグ値を取得するシンプルなヘルパー
function xmlVal(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`))
  return m?.[1]?.trim() ?? '0'
}

// A8.net publisher API エンドポイント
const A8_API_URL = 'https://paid.a8.net/a8Sales/a8SalesDetailApi.do'

export async function POST(request: NextRequest) {
  // 認証チェック
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

  // リクエストボディ（月指定があれば使用、なければ当月）
  const body = await request.json().catch(() => ({}))
  const now = new Date()
  // A8.net APIは yyyymm 形式 (例: 202604)
  const yyyymm: string = body.month
    ? String(body.month).replace('-', '').slice(0, 6)
    : `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`

  // 認証情報を取得
  const { data: creds, error: credError } = await supabase
    .from('asp_credentials')
    .select('api_key, api_secret')
    .eq('user_id', user.id)
    .eq('asp_name', 'a8net')
    .maybeSingle()

  if (credError || !creds) {
    return NextResponse.json({ error: 'A8.netの認証情報が設定されていません' }, { status: 400 })
  }

  // A8.net API 呼び出し
  const params = new URLSearchParams({
    wid: creds.api_key,
    password: creds.api_secret ?? '',
    yyyymm,
  })

  let xmlText: string
  try {
    const res = await fetch(`${A8_API_URL}?${params.toString()}`, {
      headers: { 'User-Agent': 'AffiliaterTool/1.0' },
    })
    if (!res.ok) {
      return NextResponse.json(
        { error: `A8.net APIエラー (HTTP ${res.status})` },
        { status: 502 }
      )
    }
    xmlText = await res.text()
  } catch (e) {
    return NextResponse.json(
      { error: 'A8.net APIへの接続に失敗しました' },
      { status: 502 }
    )
  }

  // エラーレスポンスチェック
  if (xmlText.includes('<error>') || xmlText.includes('<result>0</result>')) {
    const errMsg = xmlVal(xmlText, 'message') || 'A8.net認証に失敗しました'
    return NextResponse.json({ error: errMsg }, { status: 400 })
  }

  // 集計値を取得（A8.net合計行）
  const totalEarnings = parseFloat(xmlVal(xmlText, 'fixed_reward')) || 0
  const totalCv = parseInt(xmlVal(xmlText, 'fixed_count'), 10) || 0
  const totalClicks = parseInt(xmlVal(xmlText, 'click'), 10) || 0

  // 月初日 (YYYY-MM-01) に変換して保存
  const monthDate = `${yyyymm.slice(0, 4)}-${yyyymm.slice(4, 6)}-01`

  const { error: upsertError } = await supabase
    .from('asp_earnings')
    .upsert(
      {
        user_id: user.id,
        asp_name: 'a8net',
        month: monthDate,
        earnings: totalEarnings,
        cv_count: totalCv,
        click_count: totalClicks,
      },
      { onConflict: 'user_id,asp_name,month' }
    )

  if (upsertError) {
    return NextResponse.json(
      { error: `データ保存エラー: ${upsertError.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    month: monthDate,
    total_earnings: totalEarnings,
    cv_count: totalCv,
    click_count: totalClicks,
  })
}
