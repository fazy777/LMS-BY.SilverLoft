"use client"
import React from 'react'
import { CourseCatalogSkeleton } from '@/app/components/CourseSkeleton'

export default function Loading() {
  return (
    <div className="wrap py-10 min-h-screen">
      <div className="mb-8">
        <div className="w-56 h-8 rounded-lg bg-slate-200 animate-pulse mb-2"></div>
        <div className="w-80 h-4 rounded bg-slate-200 animate-pulse"></div>
      </div>
      <CourseCatalogSkeleton />
    </div>
  )
}
