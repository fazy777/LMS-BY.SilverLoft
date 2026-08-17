"use client"
import AdminGuard from '@/app/components/AdminGuard'
import AdminUsers from '@/app/pages/AdminUsers'

export default function AdminUsersRoute() {
  return (
    <AdminGuard>
      <AdminUsers />
    </AdminGuard>
  )
}
