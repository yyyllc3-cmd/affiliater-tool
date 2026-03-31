import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Affiliater Tool',
  description: 'アフィリエイター向け管理ツール',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#f5f5f0', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  )
}
