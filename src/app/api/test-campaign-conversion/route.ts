import { NextRequest, NextResponse } from 'next/server'
import { sendCampaignConversion, sendDefaultConversion } from '@/lib/campaign-conversion'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      campaignId,
      customerEmail = 'test@example.com',
      customerPhone = '+81-90-1234-5678',
      amount = 1000,
      currency = 'jpy',
      testEventCode = 'TEST5890',
      userAgent = req.headers.get('user-agent') || 'Test User Agent',
      ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1'
    } = body

    console.log('Sending test campaign conversion...', { campaignId, amount, currency })

    let result

    if (campaignId) {
      // キャンペーン別送信
      result = await sendCampaignConversion(campaignId, {
        customerEmail,
        customerPhone,
        amount,
        currency,
        eventId: `test_campaign_${Date.now()}`,
        userAgent,
        ipAddress,
        testEventCode
      })
    } else {
      // デフォルト送信
      result = await sendDefaultConversion({
        customerEmail,
        customerPhone,
        amount,
        currency,
        eventId: `test_default_${Date.now()}`,
        userAgent,
        ipAddress,
        testEventCode
      })
    }

    if (result.success) {
      return NextResponse.json({
        status: 'success',
        message: campaignId 
          ? `Test campaign conversion sent successfully for campaign ${campaignId}`
          : 'Test default conversion sent successfully',
        result,
        testData: {
          campaignId,
          customerEmail,
          customerPhone,
          amount,
          currency,
          testEventCode
        }
      })
    } else {
      return NextResponse.json(
        {
          error: 'Failed to send test conversion',
          details: result.error,
          campaignId
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Test campaign conversion failed:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send test campaign conversion',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test campaign conversion endpoint',
    usage: 'POST with body: { campaignId?, customerEmail, customerPhone, amount, currency, testEventCode? }',
    examples: {
      withCampaign: {
        campaignId: '23851969238350694',
        customerEmail: 'test@example.com',
        customerPhone: '+81-90-1234-5678',
        amount: 1000,
        currency: 'jpy',
        testEventCode: 'TEST5890'
      },
      default: {
        customerEmail: 'test@example.com',
        customerPhone: '+81-90-1234-5678',
        amount: 1000,
        currency: 'jpy',
        testEventCode: 'TEST5890'
      }
    }
  })
}
