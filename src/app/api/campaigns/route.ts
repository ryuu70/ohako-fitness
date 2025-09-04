import { NextRequest, NextResponse } from 'next/server'
import { 
  getAllActiveCampaignMappings, 
  createCampaignMapping, 
  updateCampaignMapping, 
  deleteCampaignMapping 
} from '@/lib/campaign-mapping'

// キャンペーンマッピング一覧取得
export async function GET() {
  try {
    const campaigns = await getAllActiveCampaignMappings()
    
    return NextResponse.json({
      campaigns,
      total: campaigns.length
    })
  } catch (error) {
    console.error('Failed to get campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to get campaigns' },
      { status: 500 }
    )
  }
}

// キャンペーンマッピング作成
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { campaignId, metaPixelId, metaAccessToken, campaignName } = body

    if (!campaignId || !metaPixelId || !metaAccessToken) {
      return NextResponse.json(
        { error: 'Missing required fields: campaignId, metaPixelId, metaAccessToken' },
        { status: 400 }
      )
    }

    const campaign = await createCampaignMapping({
      campaignId,
      metaPixelId,
      metaAccessToken,
      campaignName
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Failed to create campaign mapping' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Campaign mapping created successfully',
      campaign
    })
  } catch (error) {
    console.error('Failed to create campaign:', error)
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}

// キャンペーンマッピング更新
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { campaignId, metaPixelId, metaAccessToken, campaignName, isActive } = body

    if (!campaignId) {
      return NextResponse.json(
        { error: 'campaignId is required' },
        { status: 400 }
      )
    }

    const campaign = await updateCampaignMapping(campaignId, {
      metaPixelId,
      metaAccessToken,
      campaignName,
      isActive
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found or failed to update' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Campaign mapping updated successfully',
      campaign
    })
  } catch (error) {
    console.error('Failed to update campaign:', error)
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    )
  }
}

// キャンペーンマッピング削除（無効化）
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const campaignId = searchParams.get('campaignId')

    if (!campaignId) {
      return NextResponse.json(
        { error: 'campaignId is required' },
        { status: 400 }
      )
    }

    const success = await deleteCampaignMapping(campaignId)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete campaign mapping' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Campaign mapping deleted successfully'
    })
  } catch (error) {
    console.error('Failed to delete campaign:', error)
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    )
  }
}
