'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>
}
