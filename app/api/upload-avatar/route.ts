import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error('Missing env vars:', { supabaseUrl: !!supabaseUrl, anonKey: !!anonKey, serviceRoleKey: !!serviceRoleKey })
      return NextResponse.json({ error: '環境変数が不足しています' }, { status: 500 })
    }

    // ユーザー認証確認
    const supabaseAuth = createClient(supabaseUrl, anonKey)
    const { data: { user } } = await supabaseAuth.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'ファイルが見つかりません' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() ?? 'jpg'
    const filePath = `${user.id}/avatar.${ext}`
    const arrayBuffer = await file.arrayBuffer()

    // service role key でRLSをバイパスしてアップロード
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
    const { error } = await supabaseAdmin.storage
      .from('avatars')
      .upload(filePath, new Uint8Array(arrayBuffer), {
        contentType: file.type,
        upsert: true,
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(filePath)

    return NextResponse.json({ publicUrl })
  } catch (e) {
    console.error('Upload route error:', e)
    return NextResponse.json({ error: '予期しないエラーが発生しました' }, { status: 500 })
  }
}
