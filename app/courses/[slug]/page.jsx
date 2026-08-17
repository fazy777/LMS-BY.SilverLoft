"use client"
import React, { use } from 'react'
import CoursePage from '@/app/pages/CoursePage'

export default function CourseDetailPage({ params }) {
  const resolvedParams = use(params)
  return <CoursePage slug={resolvedParams.slug} />
}
