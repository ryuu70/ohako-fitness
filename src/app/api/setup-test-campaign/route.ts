import { NextResponse } from 'next/server'
import { createCampaignMapping } from '@/lib/campaign-mapping'

export async function POST() {
  try {
    // テスト用のキャンペーンマッピングを作成
    const testCampaign = await createCampaignMapping({
      campaignId: '23851969238350694', // 提供されたcampaign_id
      metaPixelId: process.env.META_PIXEL_ID || 'test_pixel_id',
      metaAccessToken: process.env.META_ACCESS_TOKEN || 'test_access_token',
      campaignName: 'Test Campaign 23851969238350694'
    })

    if (!testCampaign) {
      return NextResponse.json(
        { error: 'Failed to create test campaign mapping' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Test campaign mapping created successfully',
      campaign: testCampaign,
      instructions: {
        step1: 'Test campaign conversion with campaign ID: 23851969238350694',
        step2: 'Use POST /api/test-campaign-conversion with campaignId: 23851969238350694',
        step3: 'Check Meta Events Manager for the test event'
      }
    })
  } catch (error) {
    console.error('Failed to setup test campaign:', error)
    return NextResponse.json(
      { 
        error: 'Failed to setup test campaign',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Setup test campaign endpoint',
    usage: 'POST to create test campaign mapping for campaign ID: 23851969238350694',
    campaignId: '23851969238350694',
    note: 'This will create a test campaign mapping using your environment variables'
  })
}
