"use client"
import AdminGuard from '@/app/components/AdminGuard'
import AdminAnalytics from '@/app/pages/AdminAnalytics'

export default function AdminAnalyticsRoute() {
  return (
    <AdminGuard>
      <AdminAnalytics />
    </AdminGuard>
  )
}
