import { NextRequest, NextResponse } from 'next/server';
import { findCustomerByEmail } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({
        success: false,
        message: 'メールアドレスが必要です',
      }, { status: 400 });
    }

    console.log('デバッグ: Stripe顧客検索開始:', email);
    
    const result = await findCustomerByEmail(email);
    
    console.log('デバッグ: Stripe顧客検索結果:', result);
    
    return NextResponse.json({
      success: true,
      debug: {
        email,
        timestamp: new Date().toISOString(),
        result
      }
    });

  } catch (error) {
    console.error('デバッグエラー:', error);
    return NextResponse.json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
