#!/usr/bin/env node

const crypto = require('crypto');

/**
 * 管理者パスワードのハッシュを生成するスクリプト
 * 
 * 使用方法:
 * node scripts/generate-password-hash.js <パスワード>
 * 
 * 例:
 * node scripts/generate-password-hash.js mySecurePassword123
 */

function generatePasswordHash(password) {
  if (!password) {
    console.error('使用方法: node scripts/generate-password-hash.js <パスワード>');
    process.exit(1);
  }

  // ランダムなソルトを生成（32バイト）
  const salt = crypto.randomBytes(32).toString('hex');
  
  // PBKDF2を使用してパスワードをハッシュ化
  // 10000回の反復、64バイトの出力、SHA-512
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  
  console.log('=== 管理者パスワードハッシュ生成完了 ===');
  console.log('');
  console.log('以下の環境変数を.env.localファイルに設定してください:');
  console.log('');
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  console.log(`ADMIN_SALT=${salt}`);
  console.log('');
  console.log('注意: 元のパスワードは安全に保管し、このスクリプトの実行履歴は削除してください。');
  console.log('');
  
  // 環境変数の設定例も表示
  console.log('=== .env.local ファイルの例 ===');
  console.log('# 管理者認証設定');
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  console.log(`ADMIN_SALT=${salt}`);
  console.log('');
  console.log('=== セキュリティチェックリスト ===');
  console.log('✅ パスワードハッシュが生成されました');
  console.log('✅ ランダムなソルトが生成されました');
  console.log('✅ PBKDF2-SHA512（10000回反復）が使用されました');
  console.log('⚠️  元のパスワードを安全に保管してください');
  console.log('⚠️  このスクリプトの実行履歴を削除してください');
  console.log('⚠️  .env.localファイルをGitにコミットしないでください');
}

// コマンドライン引数からパスワードを取得
const password = process.argv[2];

if (!password) {
  console.error('エラー: パスワードが指定されていません');
  console.error('');
  console.error('使用方法:');
  console.error('  node scripts/generate-password-hash.js <パスワード>');
  console.error('');
  console.error('例:');
  console.error('  node scripts/generate-password-hash.js mySecurePassword123');
  process.exit(1);
}

// パスワードの強度チェック
if (password.length < 8) {
  console.warn('警告: パスワードが8文字未満です。セキュリティを向上させることを推奨します。');
}

if (!/[A-Z]/.test(password)) {
  console.warn('警告: パスワードに大文字が含まれていません。セキュリティを向上させることを推奨します。');
}

if (!/[a-z]/.test(password)) {
  console.warn('警告: パスワードに小文字が含まれていません。セキュリティを向上させることを推奨します。');
}

if (!/[0-9]/.test(password)) {
  console.warn('警告: パスワードに数字が含まれていません。セキュリティを向上させることを推奨します。');
}

if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
  console.warn('警告: パスワードに特殊文字が含まれていません。セキュリティを向上させることを推奨します。');
}

console.log('パスワードハッシュを生成中...');
generatePasswordHash(password);
