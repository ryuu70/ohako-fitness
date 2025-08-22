import { NextRequest, NextResponse } from 'next/server';
import { generateRandomString } from '@/lib/line-login';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({
        success: false,
        message: 'メールアドレスは必須です。',
      }, { status: 400 });
    }

    // メールアドレスの形式検証
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        message: '有効なメールアドレスを入力してください。',
      }, { status: 400 });
    }

    // stateとnonceを生成
    const state = generateRandomString();
    const nonce = generateRandomString();
    
    // 環境変数の確認
    const lineChannelId = process.env.LINE_CHANNEL_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    
    if (!lineChannelId) {
      console.error('LINE_CHANNEL_IDが設定されていません');
      return NextResponse.json({
        success: false,
        message: 'LINE設定が正しく設定されていません。',
      }, { status: 500 });
    }
    
    if (!appUrl) {
      console.error('NEXT_PUBLIC_APP_URLが設定されていません');
      return NextResponse.json({
        success: false,
        message: 'アプリケーション設定が正しく設定されていません。',
      }, { status: 500 });
    }

    console.log('環境変数確認:', { lineChannelId, appUrl });
    
    // LINEログインURLを生成
    const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?` + 
      `response_type=code&` +
      `client_id=${lineChannelId}&` +
      `redirect_uri=${encodeURIComponent(`${appUrl}/api/line-callback`)}&` +
      `state=${state}&` +
      `scope=profile%20openid%20email&` +
      `nonce=${nonce}`;

    return NextResponse.json({
      success: true,
      lineLoginUrl: lineLoginUrl,
      state: state,
      nonce: nonce,
    });

  } catch (error) {
    console.error('LINEログインURL生成エラー:', error);
    return NextResponse.json({
      success: false,
      message: 'サーバーエラーが発生しました。',
    }, { status: 500 });
  }
}
