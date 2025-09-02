import { NextResponse } from 'next/server'

export async function GET() {
  const metaAccessToken = process.env.META_ACCESS_TOKEN
  const metaPixelId = process.env.META_PIXEL_ID

  return NextResponse.json({
    meta: {
      hasAccessToken: !!metaAccessToken,
      hasPixelId: !!metaPixelId,
      accessTokenLength: metaAccessToken?.length || 0,
      pixelIdLength: metaPixelId?.length || 0,
      accessTokenPreview: metaAccessToken ? `${metaAccessToken.substring(0, 10)}...` : null,
      pixelIdPreview: metaPixelId ? `${metaPixelId.substring(0, 8)}...` : null,
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
    },
    instructions: {
      setup: 'Create .env.local file with META_ACCESS_TOKEN and META_PIXEL_ID',
      example: {
        META_ACCESS_TOKEN: 'EAABwzLixnjYBO...',
        META_PIXEL_ID: '1234567890123456'
      }
    }
  })
}
