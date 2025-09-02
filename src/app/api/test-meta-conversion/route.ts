import { NextResponse } from 'next/server'
import { sendTestMetaConversion } from '@/lib/meta-conversions'

export async function POST() {
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

    console.log('Sending test Meta conversion...')
    
    const result = await sendTestMetaConversion(metaAccessToken, metaPixelId)
    
    return NextResponse.json({
      status: 'success',
      message: 'Test Meta conversion sent successfully',
      result
    })

  } catch (error) {
    console.error('Test Meta conversion failed:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send test Meta conversion',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  const metaAccessToken = process.env.META_ACCESS_TOKEN
  const metaPixelId = process.env.META_PIXEL_ID

  return NextResponse.json({
    configured: !!(metaAccessToken && metaPixelId),
    hasAccessToken: !!metaAccessToken,
    hasPixelId: !!metaPixelId,
    pixelId: metaPixelId ? `${metaPixelId.substring(0, 8)}...` : null
  })
}
