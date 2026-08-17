"use client"
import React from 'react'
import Link from 'next/link'

export default function WorkspaceFooter() {
  return (
    <footer className="w-full border-t border-[#E2E8F0] bg-white/90 backdrop-blur-md px-6 md:px-10 py-5 mt-auto">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 text-xs">
        {/* Brand & Workspace ID */}
        <div className="flex items-center gap-3 text-[#64748B] shrink-0">
          <div className="w-6 h-6 rounded-lg bg-[#112A46] flex items-center justify-center text-[#ACC8E5] shadow-xs">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-bold text-[#112A46]">Silver Loft Workspace</span>
          <span className="text-[#CBD5E1]">•</span>
          <span>© 2026 Silver Loft LMS</span>
        </div>

        {/* Quick Nav Links */}
        <div className="flex items-center justify-center gap-6 flex-wrap font-semibold text-[#475569]">
          <Link href="/courses" className="hover:text-[#112A46] transition-colors py-0.5">
            Marketplace
          </Link>
          <Link href="/dashboard" className="hover:text-[#112A46] transition-colors py-0.5">
            Student Dashboard
          </Link>
          <Link href="/instructor" className="hover:text-[#112A46] transition-colors py-0.5">
            Instructor Studio
          </Link>
          <Link href="/account" className="hover:text-[#112A46] transition-colors py-0.5">
            Account Settings
          </Link>
          <Link href="/courses" className="hover:text-[#112A46] transition-colors py-0.5">
            Help & Documentation
          </Link>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2.5 text-[#64748B] shrink-0 bg-[#F1F5F9] px-3 py-1.5 rounded-lg border border-[#E2E8F0]">
          <span className="inline-block w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
          <span className="font-bold text-[#334155]">System Online</span>
          <span className="text-[#94A3B8] font-mono text-[11px]">• v1.4.0</span>
        </div>
      </div>
    </footer>
  )
}
