import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const envVars = {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? '設定済み' : '未設定',
      STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY ? '設定済み' : '未設定',
      LINE_CHANNEL_ID: process.env.LINE_CHANNEL_ID ? '設定済み' : '未設定',
      LINE_CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET ? '設定済み' : '未設定',
      LINE_CHANNEL_ACCESS_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN ? '設定済み' : '未設定',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ? '設定済み' : '未設定',
    };

    console.log('環境変数確認:', envVars);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      envVars
    });

  } catch (error) {
    console.error('環境変数確認エラー:', error);
    return NextResponse.json({
      success: false,
      message: 'サーバーエラーが発生しました',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
