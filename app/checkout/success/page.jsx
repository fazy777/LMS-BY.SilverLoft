"use client"
import React, { Suspense } from 'react'
import CheckoutSuccess from '@/app/pages/CheckoutSuccess'

export default function CheckoutSuccessRoute() {
  return (
    <Suspense fallback={<div style={{ padding: 60, textAlign: 'center' }}>Loading confirmation...</div>}>
      <CheckoutSuccess />
    </Suspense>
  )
}
