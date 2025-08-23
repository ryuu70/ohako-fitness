import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// 環境変数から管理者パスワードハッシュを取得
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const ADMIN_SALT = process.env.ADMIN_SALT;

// レート制限用のストレージ（本番環境ではRedis等を使用することを推奨）
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// レート制限の設定
const RATE_LIMIT_MAX_ATTEMPTS = 5; // 最大試行回数
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15分間

// パスワードハッシュ化関数
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

// レート制限チェック関数
function checkRateLimit(ip: string): { allowed: boolean; remainingAttempts: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetTime) {
    // 新しいレート制限レコードを作成
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS
    });
    return { allowed: true, remainingAttempts: RATE_LIMIT_MAX_ATTEMPTS - 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
  }
  
  if (record.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return { allowed: false, remainingAttempts: 0, resetTime: record.resetTime };
  }
  
  // 試行回数を増加
  record.count++;
  rateLimitStore.set(ip, record);
  
  return { 
    allowed: true, 
    remainingAttempts: RATE_LIMIT_MAX_ATTEMPTS - record.count, 
    resetTime: record.resetTime 
  };
}

// 古いレート制限レコードをクリーンアップ
function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // レート制限ストアのクリーンアップ
    cleanupRateLimitStore();
    
    // クライアントのIPアドレスを取得
    const realIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare
    const xForwardedFor = request.headers.get('x-forwarded-for');
    
    let ip = 'unknown';
    
    // 優先順位: Cloudflare > X-Real-IP > X-Forwarded-For > デフォルト
    if (cfConnectingIp) {
      ip = cfConnectingIp;
    } else if (realIp) {
      ip = realIp;
    } else if (xForwardedFor) {
      // カンマ区切りの最初のIPを取得（クライアントの実際のIP）
      ip = xForwardedFor.split(',')[0].trim();
    }
    
    // IPアドレスが取得できない場合は、セッションIDベースの制限にフォールバック
    if (ip === 'unknown') {
      // セッションIDまたはユーザーエージェントを使用
      const userAgent = request.headers.get('user-agent') || 'unknown';
      const sessionId = crypto.createHash('sha256').update(userAgent).digest('hex').substring(0, 16);
      ip = `session_${sessionId}`;
    }
    
    // レート制限チェック
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      const resetTime = new Date(rateLimit.resetTime).toLocaleString('ja-JP');
      return NextResponse.json(
        { 
          success: false, 
          message: `レート制限により認証が一時的にブロックされています。${resetTime}までお待ちください。`,
          remainingAttempts: rateLimit.remainingAttempts,
          resetTime: rateLimit.resetTime
        },
        { status: 429 }
      );
    }
    
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'パスワードが入力されていません。',
          remainingAttempts: rateLimit.remainingAttempts
        },
        { status: 400 }
      );
    }

    // 環境変数の設定チェック
    if (!ADMIN_PASSWORD_HASH || !ADMIN_SALT) {
      console.error('管理者パスワードの環境変数が設定されていません');
      return NextResponse.json(
        { 
          success: false, 
          message: '認証システムが正しく設定されていません。管理者に連絡してください。',
          remainingAttempts: rateLimit.remainingAttempts
        },
        { status: 500 }
      );
    }

    // パスワード認証（ハッシュ化されたパスワードと比較）
    const hashedPassword = hashPassword(password, ADMIN_SALT);
    
    if (crypto.timingSafeEqual(
      Buffer.from(hashedPassword, 'hex'),
      Buffer.from(ADMIN_PASSWORD_HASH, 'hex')
    )) {
      // 認証成功時はレート制限レコードをリセット
      rateLimitStore.delete(ip);
      
      return NextResponse.json({
        success: true,
        message: '認証が完了しました。',
        remainingAttempts: RATE_LIMIT_MAX_ATTEMPTS
      });
    } else {
      // 認証失敗
      return NextResponse.json(
        { 
          success: false, 
          message: 'パスワードが正しくありません。',
          remainingAttempts: rateLimit.remainingAttempts,
          resetTime: rateLimit.resetTime
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('認証エラー:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '認証処理中にエラーが発生しました。',
        remainingAttempts: 0
      },
      { status: 500 }
    );
  }
}
