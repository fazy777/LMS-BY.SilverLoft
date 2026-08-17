"use client"
import React, { use } from 'react'
import CoursePlayer from '@/app/pages/CoursePlayer'

export default function LearnPage({ params }) {
  const resolvedParams = use(params)
  return <CoursePlayer slug={resolvedParams.slug} />
}
