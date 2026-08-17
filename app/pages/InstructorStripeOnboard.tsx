"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function InstructorStripeOnboard({ onBack }: { onBack?: () => void }) {
  const router = useRouter()
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadStatus = async () => {
    try {
      const res = await fetch('/api/v1/instructor/stripe/status')
      const json = await res.json()
      if (json.success && json.data) {
        setStatus(json.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [])

  const handleStartOnboarding = async (testVerify = false) => {
    setConnecting(true)
    setError(null)
    setFeedback(null)
    try {
      const res = await fetch('/api/v1/instructor/stripe/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_verify: testVerify })
      })
      const json = await res.json()
      if (json.success && json.data?.url) {
        if (json.data?.onboarded) {
          setFeedback('Stripe Express test onboarding completed! Payout capability enabled.')
          loadStatus()
        } else {
          window.location.href = json.data.url
        }
      } else {
        setError(json?.error?.message || json?.message || 'Error connecting to Stripe. Ensure Stripe Connect is enabled in your Stripe Dashboard.')
      }
    } catch (e: any) {
      setError(e.message || 'Error connecting to Stripe.')
    } finally {
      setConnecting(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-20 text-[#64748B] font-semibold text-xs sm:text-sm">
        <div className="w-8 h-8 rounded-full border-3 border-[#112A46] border-t-transparent animate-spin mx-auto mb-3"></div>
        Checking Stripe Connect status...
      </div>
    )
  }

  const isOnboarded = status?.onboarded

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <button
        onClick={() => (onBack ? onBack() : router.push('/instructor'))}
        className="btn btn-ghost btn-sm text-[#64748B] hover:text-[#112A46] font-bold pl-0 text-xs cursor-pointer"
      >
        ← Back to Studio
      </button>

      <div className="card p-5 sm:p-8 md:p-10 shadow-sm bg-white">
        <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#EAF1FA] text-[#112A46] flex items-center justify-center text-xl sm:text-2xl shrink-0">
            💳
          </div>
          <div>
            <h1 className="h-display2 text-[#112A46] text-lg sm:text-2xl font-bold leading-tight">
              Stripe Express Onboarding
            </h1>
            <p className="text-xs text-[#64748B] mt-0.5 font-medium">
              Automated payouts and creator revenue distribution
            </p>
          </div>
        </div>

        {feedback && (
          <div className="p-3.5 bg-[#DCFCE7] border border-[#86EFAC] text-[#16A34A] rounded-xl text-xs sm:text-sm font-bold mb-4 sm:mb-5">
            ✓ {feedback}
          </div>
        )}
        {error && (
          <div className="p-3.5 bg-[#FEE2E2] border border-[#FCA5A5] text-[#DC2626] rounded-xl text-xs sm:text-sm font-bold mb-4 sm:mb-5">
            ✕ {error}
          </div>
        )}

        <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex justify-between items-center text-xs sm:text-sm">
            <span className="font-semibold text-[#334155]">Payout Eligibility</span>
            <span className={`pill font-bold text-[10px] ${isOnboarded ? 'pill-success' : 'pill-warning'}`}>
              {isOnboarded ? 'Connected & Active' : 'Setup Required'}
            </span>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex justify-between items-center text-xs sm:text-sm">
            <span className="font-semibold text-[#334155]">Creator Revenue Split</span>
            <strong className="font-bold text-[#112A46]">85% of Gross Sales</strong>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex justify-between items-center text-xs sm:text-sm">
            <span className="font-semibold text-[#334155]">Payout Schedule</span>
            <strong className="font-bold text-[#112A46]">Weekly Direct Deposit</strong>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => handleStartOnboarding(false)}
            disabled={connecting}
            className="btn btn-primary btn-block h-11 sm:h-12 font-bold shadow-md text-xs sm:text-sm cursor-pointer"
          >
            {connecting
              ? 'Connecting to Stripe...'
              : isOnboarded
              ? 'Update Stripe Bank & Tax Details →'
              : 'Connect Bank Account with Stripe Express →'}
          </button>

          {!isOnboarded && (
            <button
              onClick={() => handleStartOnboarding(true)}
              disabled={connecting}
              className="btn btn-ghost btn-block h-10 font-bold text-xs text-[#64748B] hover:text-[#112A46] border border-[#E2E8F0] cursor-pointer"
            >
              ⚡ Instant Sandbox Verification (Test Mode)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
