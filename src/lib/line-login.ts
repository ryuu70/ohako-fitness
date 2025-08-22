import { LineTokenResponse, LineIdTokenPayload, LineProfile } from '@/types';

// LINEログインの認証URL生成
export function generateLineLoginUrl(state: string, nonce: string): string {
  const baseUrl = 'https://access.line.me/oauth2/v2.1/authorize';
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINE_CHANNEL_ID || '',
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/line-callback`,
    state: state,
    scope: 'profile openid email',
    nonce: nonce,
  });

  return `${baseUrl}?${params.toString()}`;
}

// LINEプラットフォームからアクセストークンを取得
export async function getLineAccessToken(authorizationCode: string): Promise<LineTokenResponse | null> {
  try {
    const response = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: authorizationCode,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/line-callback`,
        client_id: process.env.LINE_CHANNEL_ID || '',
        client_secret: process.env.LINE_CHANNEL_SECRET || '',
      }),
    });

    if (!response.ok) {
      console.error('LINEアクセストークン取得エラー:', response.status, response.statusText);
      return null;
    }

    const tokenData: LineTokenResponse = await response.json();
    return tokenData;
  } catch (error) {
    console.error('LINEアクセストークン取得エラー:', error);
    return null;
  }
}

// IDトークンを検証してユーザー情報を取得
export function verifyIdToken(idToken: string): LineIdTokenPayload | null {
  try {
    // 実際の実装では、署名の検証が必要ですが、
    // 簡単のためここではJWTのペイロード部分をデコードするのみ
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('無効なIDトークン形式');
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf8')
    );

    // 基本的な検証
    if (!payload.sub || !payload.aud || !payload.exp) {
      throw new Error('IDトークンに必要な情報が不足しています');
    }

    // 有効期限チェック
    if (Date.now() >= payload.exp * 1000) {
      throw new Error('IDトークンの有効期限が切れています');
    }

    // チャネルID検証
    if (payload.aud !== process.env.LINE_CHANNEL_ID) {
      throw new Error('IDトークンのチャネルIDが一致しません');
    }

    return payload as LineIdTokenPayload;
  } catch (error) {
    console.error('IDトークン検証エラー:', error);
    return null;
  }
}

// LINEプロフィール情報をIDトークンから取得
export function getLineProfileFromIdToken(idTokenPayload: LineIdTokenPayload): LineProfile {
  return {
    userId: idTokenPayload.sub,
    displayName: idTokenPayload.name || '',
    pictureUrl: idTokenPayload.picture,
    statusMessage: '', // IDトークンにはstatusMessageが含まれないため空文字
  };
}

// ランダムな文字列を生成（state, nonce用）
export function generateRandomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
