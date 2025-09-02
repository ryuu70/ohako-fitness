import { NextRequest, NextResponse } from 'next/server'
import { sendMetaConversion } from '@/lib/meta-conversions'

export async function POST(req: NextRequest) {
  try {
    const metaAccessToken = process.env.META_ACCESS_TOKEN
    const metaPixelId = process.env.META_PIXEL_ID

    if (!metaAccessToken || !metaPixelId) {
      return NextResponse.json(
        { 
          error: 'Meta API credentials not configured',
          required: ['META_ACCESS_TOKEN', 'META_PIXEL_ID']
        },
        { status: 400 }
      )
    }

    // リクエストボディからテストデータを取得
    const body = await req.json()
    const {
      customerEmail = 'test@example.com',
      customerPhone = '+81-90-1234-5678',
      amount = 1000, // 10円
      currency = 'jpy',
      userAgent = req.headers.get('user-agent') || 'Test User Agent',
      ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1'
    } = body

    console.log('Sending test Stripe-like conversion to Meta API...')
    
    const result = await sendMetaConversion(
      metaAccessToken,
      metaPixelId,
      {
        customerEmail,
        customerPhone,
        amount,
        currency,
        eventId: `test_stripe_${Date.now()}`,
        userAgent,
        ipAddress
      }
    )
    
    return NextResponse.json({
      status: 'success',
      message: 'Test Stripe-like conversion sent successfully',
      result,
      testData: {
        customerEmail,
        customerPhone,
        amount,
        currency,
        eventId: `test_stripe_${Date.now()}`
      }
    })

  } catch (error) {
    console.error('Test Stripe-like conversion failed:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send test Stripe-like conversion',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test Stripe-like Meta conversion endpoint',
    usage: 'POST with optional body: { customerEmail, customerPhone, amount, currency }',
    example: {
      customerEmail: 'test@example.com',
      customerPhone: '+81-90-1234-5678',
      amount: 1000,
      currency: 'jpy'
    }
  })
}
