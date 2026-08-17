"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AccountPage({ onBack }: { onBack?: () => void }) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [applying, setApplying] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/v1/users/me')
      const json = await res.json()
      if (json.success && json.data) {
        setUser(json.data)
        setDisplayName(json.data.display_name || '')
        setBio(json.data.instructor_profile?.bio || '')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFeedback(null)
    setError(null)
    try {
      const res = await fetch('/api/v1/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName.trim() }),
      })
      const json = await res.json()
      if (json.success) {
        setFeedback('Profile updated successfully in database!')
        loadProfile()
      } else {
        setError(json.error?.message || 'Failed to update profile.')
      }
    } catch (e: any) {
      setError(e.message || 'Error updating profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleBecomeInstructor = async () => {
    setApplying(true)
    setFeedback(null)
    setError(null)
    try {
      const res = await fetch('/api/v1/users/me/become-instructor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: bio.trim() || undefined }),
      })
      const json = await res.json()
      if (json.success) {
        setFeedback('Congratulations! You are now an instructor. You can create and publish courses.')
        loadProfile()
      } else {
        setError(json.error?.message || 'Application could not be processed.')
      }
    } catch (e: any) {
      setError(e.message || 'Error applying for instructor.')
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-20 text-[#64748B] font-semibold">
        Loading account details...
      </div>
    )
  }

  const initials = (displayName || user?.email || 'AJ').slice(0, 2).toUpperCase()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => (onBack ? onBack() : router.push('/dashboard'))}
        className="btn btn-ghost btn-sm text-[#64748B] hover:text-[#112A46] font-bold pl-0"
      >
        ← Back to Dashboard
      </button>

      <div className="card p-8 md:p-10 shadow-sm">
        {/* Header & Avatar */}
        <div className="flex items-center gap-5 pb-6 mb-6 border-b border-[#F1F5F9]">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#ACC8E5] to-[#112A46] text-white flex items-center justify-center font-black text-xl shrink-0 shadow-sm">
            {initials}
          </div>
          <div>
            <h1 className="h-display2 text-[#112A46] leading-tight">
              {user?.display_name || 'Account Settings'}
            </h1>
            <div className="text-xs text-[#64748B] mt-1 font-medium">
              {user?.email} · <span className="font-bold text-[#112A46] capitalize">{user?.is_admin ? 'Administrator' : user?.is_instructor ? 'Instructor' : 'Student'}</span>
            </div>
          </div>
        </div>

        {feedback && (
          <div className="p-3.5 bg-[#DCFCE7] border border-[#86EFAC] text-[#16A34A] rounded-xl text-sm font-bold mb-5">
            {feedback}
          </div>
        )}
        {error && (
          <div className="p-3.5 bg-[#FEE2E2] border border-[#FCA5A5] text-[#DC2626] rounded-xl text-sm font-bold mb-5">
            {error}
          </div>
        )}

        {/* Profile Form */}
        <form onSubmit={handleUpdateProfile} className="space-y-4 mb-8">
          <div className="field">
            <label>Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="input bg-white text-[#0B1B2E]"
            />
          </div>

          <div className="field">
            <label>Email Address (Managed by Firebase Auth)</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="input bg-[#F8FAFC] text-[#64748B] cursor-not-allowed border-[#CBD5E1]"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary btn-sm font-bold shadow-sm"
          >
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>

        {/* Upgrade to Instructor Section */}
        {!user?.is_instructor && !user?.is_admin && (
          <div className="border-t border-[#F1F5F9] pt-6">
            <div className="card p-6 bg-[#EAF1FA] border-[#ACC8E5]">
              <h3 className="h-card text-base text-[#112A46] mb-1 font-bold">
                Become an Instructor
              </h3>
              <p className="text-xs text-[#334155] mb-4 leading-relaxed font-medium">
                Share your technical knowledge and earn revenue by publishing self-paced video courses on Silver Loft. Instant self-serve activation.
              </p>

              <textarea
                rows={2}
                placeholder="Tell us a little about your teaching background / bio (optional)..."
                value={bio}
                onChange={e => setBio(e.target.value)}
                className="input h-auto py-2 text-xs mb-3 bg-white text-[#0B1B2E]"
              />

              <button
                onClick={handleBecomeInstructor}
                disabled={applying}
                className="btn btn-primary btn-sm font-bold"
              >
                {applying ? 'Activating Instructor Account...' : 'Activate Instructor Account →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
