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
      amount = 1000,
      currency = 'jpy',
      testEventCode = 'TEST5890', // デフォルトのテストコード
      userAgent = req.headers.get('user-agent') || 'Test User Agent',
      ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1'
    } = body

    console.log('Sending test event to Meta API with test code:', testEventCode)
    
    const result = await sendMetaConversion(
      metaAccessToken,
      metaPixelId,
      {
        customerEmail,
        customerPhone,
        amount,
        currency,
        eventId: `test_event_${Date.now()}`,
        userAgent,
        ipAddress,
        testEventCode
      }
    )
    
    return NextResponse.json({
      status: 'success',
      message: 'Test event sent successfully to Meta Events Manager',
      result,
      testEventCode,
      instructions: {
        step1: 'Check Meta Events Manager for the test event',
        step2: 'Look for test_event_code: ' + testEventCode,
        step3: 'Verify the event appears in the test events section'
      },
      testData: {
        customerEmail,
        customerPhone,
        amount,
        currency,
        testEventCode,
        eventId: `test_event_${Date.now()}`
      }
    })

  } catch (error) {
    console.error('Test event failed:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send test event',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Meta Events Manager test event endpoint',
    usage: 'POST with optional body: { customerEmail, customerPhone, amount, currency, testEventCode }',
    defaultTestCode: 'TEST5890',
    example: {
      customerEmail: 'test@example.com',
      customerPhone: '+81-90-1234-5678',
      amount: 1000,
      currency: 'jpy',
      testEventCode: 'TEST5890'
    },
    instructions: {
      step1: 'Use the test_event_code from Meta Events Manager',
      step2: 'Send POST request with test data',
      step3: 'Check Meta Events Manager for the test event',
      step4: 'Verify event appears in test events section'
    }
  })
}
