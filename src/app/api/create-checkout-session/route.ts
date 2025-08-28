import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

export async function POST(req: NextRequest) {
  try {
    const { successUrl, cancelUrl } = await req.json()

    // Stripe Checkoutセッションを作成
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: 'テスト商品',
              description: 'Stripe Checkoutのテスト用商品です',
            },
            unit_amount: 1000, // ¥1,000
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${req.nextUrl.origin}/stripe-test/success`,
      cancel_url: cancelUrl || `${req.nextUrl.origin}/stripe-test/cancel`,
      customer_email: 'test@example.com', // テスト用のメールアドレス
      metadata: {
        test: 'true',
        source: 'stripe-test-page'
      }
    })

    return NextResponse.json({ sessionId: session.id })

  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
