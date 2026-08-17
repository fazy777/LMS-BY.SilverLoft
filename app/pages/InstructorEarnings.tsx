"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Payout {
  id: number
  amount_cents: number
  status: string
  created_at: string
}

export default function InstructorEarnings({ onStripeOnboard }: { onStripeOnboard?: () => void }) {
  const router = useRouter()
  const [earnings, setEarnings] = useState<any>(null)
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Fetch Earnings Summary from SQL
    fetch('/api/v1/instructor/earnings')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) setEarnings(json.data)
      })
      .catch(() => {})

    // 2. Fetch Payouts from SQL
    fetch('/api/v1/instructor/payouts')
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data?.payouts)) {
          setPayouts(json.data.payouts)
        } else {
          setPayouts([])
        }
        setLoading(false)
      })
      .catch(() => {
        setPayouts([])
        setLoading(false)
      })
  }, [])

  const formatCents = (cents: number | undefined) => `$${((cents || 0) / 100).toFixed(2)}`

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[#E2E8F0] rounded-xl animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-white border border-[#E2E8F0] rounded-2xl animate-pulse p-6"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="h-display2 text-[#112A46] text-xl sm:text-2xl md:text-3xl font-extrabold leading-tight">
            Earnings & Financial Ledger
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 font-medium">
            Real-time breakdown of course sales, creator shares, and Stripe Express payouts.
          </p>
        </div>

        <button
          onClick={() => (onStripeOnboard ? onStripeOnboard() : router.push('/instructor/stripe'))}
          className="btn btn-secondary btn-sm font-bold shadow-sm text-xs sm:text-sm px-4 h-10 w-full sm:w-auto shrink-0 cursor-pointer"
        >
          Stripe Payout Settings →
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <div className="stat-card">
          <div className="text-[11px] sm:text-xs uppercase font-bold tracking-wider text-[#64748B]">Total Lifetime Earned</div>
          <div className="stat-num mt-1 text-[#112A46] font-black">
            {earnings?.total_earnings_cents !== undefined ? formatCents(earnings.total_earnings_cents) : '$0.00'}
          </div>
          <div className="text-[11px] sm:text-xs text-[#64748B] mt-1 font-medium">Derived from immutable SQL ledger</div>
        </div>

        <div className="stat-card">
          <div className="text-[11px] sm:text-xs uppercase font-bold tracking-wider text-[#64748B]">Pending Payout Balance</div>
          <div className="stat-num mt-1 text-[#D97706] font-black">
            {earnings?.pending_cents !== undefined ? formatCents(earnings.pending_cents) : '$0.00'}
          </div>
          <div className="text-[11px] sm:text-xs text-[#64748B] mt-1 font-medium">Scheduled for next transfer</div>
        </div>

        <div className="stat-card">
          <div className="text-[11px] sm:text-xs uppercase font-bold tracking-wider text-[#64748B]">Deposited to Bank</div>
          <div className="stat-num mt-1 text-[#16A34A] font-black">
            {earnings?.paid_cents !== undefined ? formatCents(earnings.paid_cents) : '$0.00'}
          </div>
          <div className="text-[11px] sm:text-xs text-[#16A34A] mt-1 font-semibold">✓ Direct transfer via Stripe Express</div>
        </div>
      </div>

      {/* Payout History Table */}
      <div className="card overflow-x-auto shadow-sm bg-white">
        <div className="p-4 sm:p-5 border-b border-[#E2E8F0] font-bold text-xs sm:text-sm text-[#112A46] bg-[#F8FAFC]">
          Direct Deposit & Transfer Ledger
        </div>

        {payouts.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="text-2xl mb-2">💸</div>
            <p className="text-xs sm:text-sm text-[#64748B] font-medium">
              No payout history recorded yet. Earnings will accumulate as students purchase your courses.
            </p>
          </div>
        ) : (
          <table className="data-table min-w-[500px]">
            <thead>
              <tr>
                <th>Payout ID</th>
                <th>Date Settled</th>
                <th>Amount</th>
                <th>Transfer Status</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id} className="hover:bg-[#F8FAFC]">
                  <td className="font-bold text-xs sm:text-sm text-[#112A46]">#{p.id}</td>
                  <td className="text-xs text-[#64748B] font-semibold">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="font-display font-black text-xs sm:text-sm text-[#112A46]">{formatCents(p.amount_cents)}</td>
                  <td>
                    <span className="pill pill-success text-[10px] font-bold">
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
