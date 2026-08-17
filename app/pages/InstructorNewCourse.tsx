"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Category {
  id: number
  name: string
  slug: string
}

export default function InstructorNewCourse({
  onCourseCreated,
  onBack,
}: {
  onCourseCreated?: (id: number) => void
  onBack?: () => void
}) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [priceDollars, setPriceDollars] = useState('49')
  const [thumbnailUrl, setThumbnailUrl] = useState('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=720&h=405&fit=crop')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/v1/categories')
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setCategories(json.data)
          setCategoryId(String(json.data[0].id))
        }
      })
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Please provide a course title.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const priceCents = Math.round(parseFloat(priceDollars || '0') * 100)
      const res = await fetch('/api/v1/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          category_id: categoryId ? parseInt(categoryId) : null,
          price_cents: priceCents,
          thumbnail_url: thumbnailUrl.trim() || null,
          status: 'draft',
        }),
      })
      const json = await res.json()
      if (json.success && json.data?.id) {
        if (onCourseCreated) {
          onCourseCreated(json.data.id)
        } else {
          router.push(`/instructor/courses/${json.data.id}`)
        }
      } else {
        setError(json.error?.message || 'Could not create course.')
      }
    } catch (e: any) {
      setError(e.message || 'Error creating course.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => (onBack ? onBack() : router.push('/instructor'))}
        className="btn btn-ghost btn-sm text-[#64748B] hover:text-[#112A46] font-bold pl-0"
      >
        ← Back to Studio
      </button>

      <div className="card p-8 md:p-10 shadow-sm">
        <h1 className="h-display2 text-[#112A46] mb-1">Create New Course</h1>
        <p className="text-sm text-[#64748B] mb-6 font-medium">
          Draft your course title, pricing, and description. You will add curriculum modules and video lessons on the next screen.
        </p>

        {error && (
          <div className="p-3.5 bg-[#FEE2E2] border border-[#FCA5A5] text-[#DC2626] rounded-xl text-sm font-bold mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="field">
            <label>Course Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Master Enterprise Next.js 16 with Turbopack"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="input text-sm bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="field">
              <label>Topic Category</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="input text-sm bg-white cursor-pointer"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Price (USD $)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={priceDollars}
                onChange={e => setPriceDollars(e.target.value)}
                className="input text-sm bg-white"
              />
            </div>
          </div>

          <div className="field">
            <label>Cover Thumbnail URL</label>
            <input
              type="url"
              placeholder="https://..."
              value={thumbnailUrl}
              onChange={e => setThumbnailUrl(e.target.value)}
              className="input text-sm bg-white"
            />
          </div>

          <div className="field">
            <label>Overview & What Students Will Build</label>
            <textarea
              rows={4}
              placeholder="Explain the objectives, technologies used, and final projects students will build..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="input h-auto py-3 text-sm bg-white resize-vertical"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => (onBack ? onBack() : router.push('/instructor'))}
              className="btn btn-secondary btn-sm font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary btn-sm font-bold shadow-md"
            >
              {saving ? 'Creating Draft...' : 'Create Course & Build Curriculum →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
