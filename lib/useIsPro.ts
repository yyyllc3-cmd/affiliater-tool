import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export function useIsPro(): boolean | null {
  const [isPro, setIsPro] = useState<boolean | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setIsPro(false); return }
      const { data } = await supabase
        .from('profiles')
        .select('is_pro')
        .eq('id', user.id)
        .single()
      setIsPro(data?.is_pro ?? false)
    })
  }, [])

  return isPro
}
