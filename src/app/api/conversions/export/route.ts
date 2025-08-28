import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // フィルタリング条件を構築
    const where: {
      customerEmail?: { contains: string; mode: 'insensitive' };
      createdAt?: { gte?: Date; lte?: Date };
    } = {}
    
    if (email) {
      where.customerEmail = { contains: email, mode: 'insensitive' }
    }
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    // 全コンバージョンデータを取得
    const conversions = await prisma.conversion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        customerEmail: true,
        amount: true,
        currency: true,
        status: true,
        createdAt: true,
        stripeEventId: true,
      }
    })

    // CSVヘッダー
    const csvHeaders = [
      'ID',
      '顧客メールアドレス',
      '金額（セント）',
      '通貨',
      'ステータス',
      '作成日時',
      'Stripe Event ID'
    ]

    // CSVデータ行
    const csvRows = conversions.map(conversion => [
      conversion.id,
      conversion.customerEmail,
      conversion.amount,
      conversion.currency,
      conversion.status,
      conversion.createdAt.toISOString(),
      conversion.stripeEventId
    ])

    // CSVコンテンツを生成
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n')

    // レスポンスヘッダーを設定
    const headers = new Headers()
    headers.set('Content-Type', 'text/csv; charset=utf-8')
    headers.set('Content-Disposition', `attachment; filename="conversions_${new Date().toISOString().split('T')[0]}.csv"`)

    return new NextResponse(csvContent, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Error exporting conversions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
