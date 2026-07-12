import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Playground | Conversation Platform',
  description: 'Interactive API playground for testing and exploration',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
