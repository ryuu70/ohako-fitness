import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  console.log('Webhook received:', new Date().toISOString())
  
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')
    
    console.log('Webhook body length:', body.length)
    console.log('Webhook signature:', signature ? 'present' : 'missing')

    if (!signature) {
      console.error('Stripe signature is missing')
      return NextResponse.json(
        { error: 'Stripe signature is missing' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      console.log('Webhook secret length:', webhookSecret.length)
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log('Webhook event type:', event.type)
      console.log('Webhook event id:', event.id)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // 決済完了イベントの処理
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      
      // 既存のコンバージョンレコードをチェック
      const existingConversion = await prisma.conversion.findUnique({
        where: { stripeEventId: event.id }
      })

      if (existingConversion) {
        console.log('Conversion already exists for event:', event.id)
        return NextResponse.json({ status: 'already_processed' })
      }

      // コンバージョンデータを作成
      const conversionData = {
        stripeEventId: event.id,
        customerEmail: session.customer_details?.email || 'unknown@example.com',
        amount: session.amount_total || 0,
        currency: session.currency || 'jpy',
        metadata: {
          sessionId: session.id,
          customerId: typeof session.customer === 'string' ? session.customer : session.customer?.id || null,
          paymentStatus: session.payment_status,
          customerDetails: session.customer_details ? {
            email: session.customer_details.email,
            name: session.customer_details.name,
            phone: session.customer_details.phone,
            address: session.customer_details.address ? {
              city: session.customer_details.address.city,
              country: session.customer_details.address.country,
              line1: session.customer_details.address.line1,
              line2: session.customer_details.address.line2,
              postal_code: session.customer_details.address.postal_code,
              state: session.customer_details.address.state
            } : null
          } : null,
        }
      }

      // DBに保存
      const conversion = await prisma.conversion.create({
        data: conversionData
      })

      console.log('Conversion created:', conversion)
      return NextResponse.json({ 
        status: 'success', 
        conversionId: conversion.id 
      })
    }

    // サブスクリプション作成イベントの処理
    if (event.type === 'customer.subscription.created') {
      const subscription = event.data.object as Stripe.Subscription
      
      // 既存のコンバージョンレコードをチェック
      const existingConversion = await prisma.conversion.findUnique({
        where: { stripeEventId: event.id }
      })

      if (existingConversion) {
        console.log('Conversion already exists for event:', event.id)
        return NextResponse.json({ status: 'already_processed' })
      }

      // 顧客情報を取得
      let customerEmail = 'unknown@example.com'
      let customerId = subscription.customer as string
      
      try {
        const customer = await stripe.customers.retrieve(customerId)
        if (customer && !customer.deleted) {
          customerEmail = customer.email || 'unknown@example.com'
        }
      } catch (error) {
        console.error('Failed to retrieve customer:', error)
      }

      // サブスクリプションの金額を計算
      const amount = subscription.items.data.reduce((total, item) => {
        return total + (item.price?.unit_amount || 0)
      }, 0)

      // コンバージョンデータを作成
      const conversionData = {
        stripeEventId: event.id,
        customerEmail: customerEmail,
        amount: amount,
        currency: subscription.currency || 'jpy',
        metadata: {
          eventType: 'customer.subscription.created',
          subscriptionId: subscription.id,
          customerId: customerId,
          status: subscription.status,
          currentPeriodStart: subscription.current_period_start,
          currentPeriodEnd: subscription.current_period_end,
          planId: subscription.items.data[0]?.price?.id || null,
          planName: subscription.items.data[0]?.price?.nickname || null,
          interval: subscription.items.data[0]?.price?.recurring?.interval || null,
          intervalCount: subscription.items.data[0]?.price?.recurring?.interval_count || null,
          trialEnd: subscription.trial_end,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          created: subscription.created,
          startDate: subscription.start_date
        }
      }

      // DBに保存
      const conversion = await prisma.conversion.create({
        data: conversionData
      })

      console.log('Subscription conversion created:', conversion)
      return NextResponse.json({ 
        status: 'success', 
        conversionId: conversion.id 
      })
    }

    // その他のイベントタイプは無視
    return NextResponse.json({ status: 'ignored' })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
