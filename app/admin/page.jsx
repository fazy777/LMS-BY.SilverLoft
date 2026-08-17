"use client"
import AdminGuard from '@/app/components/AdminGuard'
import AdminDashboard from '@/app/pages/AdminDashboard'

export default function AdminDashboardRoute() {
  return (
    <AdminGuard>
      <AdminDashboard />
    </AdminGuard>
  )
}
