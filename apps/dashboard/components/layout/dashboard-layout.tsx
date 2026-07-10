'use client'

import { Sidebar } from './sidebar'
import { Header } from './header'
import { ThemeProvider } from '@/components/theme-provider'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto scrollbar-thin bg-muted/30">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}
