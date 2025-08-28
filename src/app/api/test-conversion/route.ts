import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // テスト用のコンバージョンデータを作成
    const testConversion = await prisma.conversion.create({
      data: {
        stripeEventId: `test_${Date.now()}`,
        customerEmail: `test${Date.now()}@example.com`,
        amount: 5000, // 50ドル
        currency: 'jpy',
        status: 'completed',
        metadata: {
          test: true,
          createdAt: new Date().toISOString()
        }
      }
    })

    return NextResponse.json({
      status: 'success',
      message: 'テストコンバージョンが作成されました',
      conversion: testConversion
    })

  } catch (error) {
    console.error('Error creating test conversion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
