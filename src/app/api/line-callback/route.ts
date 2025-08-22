import { NextRequest, NextResponse } from 'next/server';
import { getLineAccessToken, verifyIdToken, getLineProfileFromIdToken } from '@/lib/line-login';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // エラーレスポンスの処理
    if (error) {
      const errorDescription = searchParams.get('error_description');
      console.error('LINEログインエラー:', error, errorDescription);
      
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/line-connect?error=${encodeURIComponent(error)}&message=${encodeURIComponent(errorDescription || 'LINEログインでエラーが発生しました')}`
      );
    }

    // 必要なパラメータの確認
    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/line-connect?error=invalid_request&message=${encodeURIComponent('必要なパラメータが不足しています')}`
      );
    }

    // アクセストークンの取得
    const tokenResponse = await getLineAccessToken(code);
    if (!tokenResponse) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/line-connect?error=token_error&message=${encodeURIComponent('アクセストークンの取得に失敗しました')}`
      );
    }

    // IDトークンの検証
    const idTokenPayload = verifyIdToken(tokenResponse.id_token);
    if (!idTokenPayload) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/line-connect?error=token_verification_error&message=${encodeURIComponent('IDトークンの検証に失敗しました')}`
      );
    }

    // プロフィール情報の取得
    const lineProfile = getLineProfileFromIdToken(idTokenPayload);

    // LINEユーザーIDとプロフィール情報をセッションまたはクエリパラメータで渡す
    // ここでは簡単のためクエリパラメータで渡します
    const redirectUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/line-connect`);
    redirectUrl.searchParams.set('lineUserId', lineProfile.userId);
    redirectUrl.searchParams.set('displayName', lineProfile.displayName);
    redirectUrl.searchParams.set('email', idTokenPayload.email || '');
    redirectUrl.searchParams.set('state', state);

    return NextResponse.redirect(redirectUrl.toString());

  } catch (error) {
    console.error('LINEログインコールバック処理エラー:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/line-connect?error=server_error&message=${encodeURIComponent('サーバーエラーが発生しました')}`
    );
  }
}
