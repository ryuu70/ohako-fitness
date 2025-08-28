import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const email = searchParams.get('email')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * limit

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

    // コンバージョンデータを取得
    const [conversions, total] = await Promise.all([
      prisma.conversion.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          customerEmail: true,
          amount: true,
          currency: true,
          status: true,
          createdAt: true,
          metadata: true,
        }
      }),
      prisma.conversion.count({ where })
    ])

    // 集計データを取得
    const totalAmount = await prisma.conversion.aggregate({
      where,
      _sum: { amount: true }
    })

    return NextResponse.json({
      conversions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      summary: {
        totalAmount: totalAmount._sum.amount || 0,
        totalConversions: total
      }
    })

  } catch (error) {
    console.error('Error fetching conversions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
