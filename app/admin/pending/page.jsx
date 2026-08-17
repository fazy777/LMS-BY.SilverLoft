"use client"
import AdminGuard from '@/app/components/AdminGuard'
import AdminPendingCourses from '@/app/pages/AdminPendingCourses'

export default function AdminPendingRoute() {
  return (
    <AdminGuard>
      <AdminPendingCourses />
    </AdminGuard>
  )
}
