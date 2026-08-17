"use client"
import React, { Suspense } from 'react'
import CourseCatalog from '@/app/pages/CourseCatalog'

export default function CoursesPage() {
  return (
    <Suspense fallback={<div style={{ padding: 60, textAlign: 'center' }}>Loading catalog...</div>}>
      <CourseCatalog />
    </Suspense>
  )
}
