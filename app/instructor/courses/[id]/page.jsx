"use client"
import React, { use } from 'react'
import InstructorCourseEditor from '@/app/pages/InstructorCourseEditor'

export default function InstructorEditCourseRoute({ params }) {
  const resolvedParams = use(params)
  return <InstructorCourseEditor courseId={resolvedParams.id} />
}
