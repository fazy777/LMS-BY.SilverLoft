"use client"
import React, { useState, useEffect } from 'react'
import { SearchIcon } from '../components/Icons'

interface UserItem {
  id: number
  email: string
  display_name: string
  avatar_url?: string | null
  is_instructor?: boolean
  is_admin?: boolean
  status: 'active' | 'suspended'
  created_at: string
}

const FALLBACK_USERS: UserItem[] = [
  { id: 1, email: 'hafizmfaizanali@gmail.com', display_name: 'Faizan Ali', is_admin: true, is_instructor: true, status: 'active', created_at: new Date(Date.now() - 90*86400000).toISOString() },
  { id: 2, email: 'marta.coelho@example.com', display_name: 'Marta Coelho', is_admin: false, is_instructor: true, status: 'active', created_at: new Date(Date.now() - 60*86400000).toISOString() },
  { id: 3, email: 'owen.faraday@example.com', display_name: 'Owen Faraday', is_admin: false, is_instructor: true, status: 'active', created_at: new Date(Date.now() - 45*86400000).toISOString() },
  { id: 4, email: 'jordan.cole@example.com', display_name: 'Jordan Cole', is_admin: false, is_instructor: false, status: 'active', created_at: new Date(Date.now() - 30*86400000).toISOString() },
  { id: 5, email: 'elena.rostova@example.com', display_name: 'Elena Rostova', is_admin: false, is_instructor: false, status: 'active', created_at: new Date(Date.now() - 15*86400000).toISOString() },
  { id: 6, email: 'alex.spammer@example.com', display_name: 'Alex Spammer', is_admin: false, is_instructor: false, status: 'suspended', created_at: new Date(Date.now() - 8*86400000).toISOString() },
]

type Tab = 'All' | 'Students' | 'Instructors' | 'Admins' | 'Suspended'

export default function AdminUsers() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('All')
  const [feedback, setFeedback] = useState<string | null>(null)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set('q', search.trim())
      if (activeTab === 'Instructors') params.set('is_instructor', 'true')
      if (activeTab === 'Suspended') params.set('status', 'suspended')

      const res = await fetch(`/api/v1/admin/users?${params.toString()}`)
      const json = await res.json()
      if (json.success && Array.isArray(json.data?.users)) {
        setUsers(json.data.users)
      } else {
        setUsers(FALLBACK_USERS)
      }
    } catch (e) {
      setUsers(FALLBACK_USERS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [search, activeTab])

  const handleToggleStatus = async (user: UserItem) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active'
    try {
      const res = await fetch('/api/v1/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, status: nextStatus }),
      })
      const json = await res.json()
      if (json.success) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: nextStatus } : u))
        setFeedback(`Account for ${user.display_name} marked as ${nextStatus}.`)
        setTimeout(() => setFeedback(null), 3000)
      } else {
        setFeedback(json.error?.message || 'Could not update user status.')
        setTimeout(() => setFeedback(null), 3000)
      }
    } catch (e) {
      setFeedback('Failed to update status.')
      setTimeout(() => setFeedback(null), 3000)
    }
  }

  const filteredUsers = users.filter((u) => {
    if (search.trim()) {
      const term = search.trim().toLowerCase()
      const nameMatch = u.display_name?.toLowerCase().includes(term)
      const emailMatch = u.email?.toLowerCase().includes(term)
      if (!nameMatch && !emailMatch) return false
    }
    if (activeTab === 'Students') return !u.is_instructor && !u.is_admin
    if (activeTab === 'Instructors') return Boolean(u.is_instructor)
    if (activeTab === 'Admins') return Boolean(u.is_admin)
    if (activeTab === 'Suspended') return u.status === 'suspended'
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="h-display2 text-[#112A46] text-xl sm:text-2xl md:text-3xl font-extrabold leading-tight">User Account Controls</h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 font-medium">
            Search registered accounts, view roles, and manage system privileges.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none">
            <SearchIcon size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-10 pr-8 h-11 text-sm bg-white border border-[#CBD5E1] rounded-full focus:border-[#112A46] focus:ring-2 focus:ring-[#112A46]/20 transition-all text-[#0B1B2E]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#64748B] text-[10px] font-bold transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="p-4 bg-[#DCFCE7] border border-[#86EFAC] text-[#16A34A] rounded-xl text-sm font-bold shadow-sm">
          {feedback}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {(['All', 'Students', 'Instructors', 'Admins', 'Suspended'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`btn btn-sm shrink-0 ${activeTab === tab ? 'btn-primary' : 'btn-secondary'} text-xs font-bold`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="card overflow-x-auto shadow-sm">
        <table className="data-table min-w-[640px]">
          <thead>
            <tr>
              <th>User Account</th>
              <th>System Role</th>
              <th>Account Status</th>
              <th>Joined Date</th>
              <th className="text-right">Privilege Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => {
              const initials = (u.display_name || u.email || 'US').slice(0, 2).toUpperCase()
              return (
                <tr key={u.id} className="hover:bg-[#F8FAFC]">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#ACC8E5] to-[#112A46] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-[#0B1B2E] truncate leading-tight">{u.display_name || 'Anonymous User'}</div>
                        <div className="text-xs text-[#64748B] truncate mt-0.5">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`pill text-[10px] font-bold ${
                      u.is_admin ? 'bg-[#EDE9FE] text-[#5B21B6]' : u.is_instructor ? 'bg-[#E0F2FE] text-[#0369A1]' : 'bg-[#F1F5F9] text-[#334155]'
                    }`}>
                      {u.is_admin ? 'Administrator' : u.is_instructor ? 'Instructor' : 'Student'}
                    </span>
                  </td>
                  <td>
                    <span className={`pill text-[10px] font-bold ${
                      u.status === 'active' ? 'pill-success' : 'pill-danger'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="text-xs text-[#64748B] font-semibold">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="text-right">
                    {!u.is_admin && (
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`btn btn-sm text-xs font-bold ${
                          u.status === 'active'
                            ? 'btn-danger-ghost border border-[#FCA5A5] text-[#DC2626]'
                            : 'btn-secondary text-[#16A34A] border-[#86EFAC]'
                        }`}
                      >
                        {u.status === 'active' ? 'Suspend Account' : 'Reactivate'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
