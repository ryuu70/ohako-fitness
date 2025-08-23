# 管理者ページ セットアップガイド

## 概要
このページでは、OHAKO fitness studioの管理者向けダッシュボードのセットアップ手順を説明します。

## 機能
- パスワード認証による管理者ログイン
- サブスクライブ契約継続中の顧客一覧表示
- LINE ID連携状況の確認
- 顧客データのCSV出力

## セットアップ手順

### 1. 環境変数の設定
`.env.local`ファイルに以下の環境変数を追加してください：

```bash
# Stripe設定
STRIPE_SECRET_KEY=sk_test_...  # 本番環境ではsk_live_...

# 管理者パスワード（セキュリティのため強力なパスワードを使用）
ADMIN_PASSWORD=your_secure_password_here
```

### 2. データベース連携の実装
現在、LINE連携情報は仮のデータを使用しています。実際の運用では、以下の実装が必要です：

#### LINE連携テーブルの例
```sql
CREATE TABLE line_connections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id VARCHAR(255) NOT NULL,
  line_id VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_customer_id (customer_id),
  INDEX idx_line_id (line_id)
);
```

#### データベースクエリの実装
`src/app/api/admin/customers/route.ts`と`src/app/api/admin/export-csv/route.ts`の
`getLineIdByCustomerId`関数を実際のデータベースクエリに置き換えてください。

例：
```typescript
async function getLineIdByCustomerId(customerId: string): Promise<string | null> {
  try {
    const result = await db.query(
      'SELECT line_id FROM line_connections WHERE customer_id = ?',
      [customerId]
    );
    return result[0]?.line_id || null;
  } catch (error) {
    console.error('LINE ID取得エラー:', error);
    return null;
  }
}
```

### 3. アクセス方法
管理者ページは以下のURLでアクセスできます：
```
https://your-domain.com/admin
```

## セキュリティ考慮事項

### 1. パスワード管理
- 強力なパスワードを使用
- 定期的なパスワード変更
- 環境変数での管理（コードにハードコーディングしない）

### 2. アクセス制御
- 管理者ページへのアクセスは特定のIPアドレスからのみ許可
- 必要に応じて2段階認証の実装を検討

### 3. ログ監視
- 管理者ページへのアクセスログの記録
- 異常なアクセスパターンの監視

## トラブルシューティング

### 1. Stripe接続エラー
- `STRIPE_SECRET_KEY`が正しく設定されているか確認
- Stripeアカウントの権限設定を確認

### 2. CSV出力エラー
- ファイルの書き込み権限を確認
- メモリ不足の場合は、データの分割処理を検討

### 3. 認証エラー
- 環境変数`ADMIN_PASSWORD`が正しく設定されているか確認
- ブラウザのキャッシュをクリア

## カスタマイズ

### 1. 表示項目の追加
顧客一覧に表示する項目を追加する場合は、以下を修正してください：
- `CustomerData`インターフェース
- テーブルヘッダー
- CSV出力ヘッダー

### 2. フィルタリング機能
特定の条件で顧客を絞り込む機能を追加する場合は、APIエンドポイントにクエリパラメータを追加してください。

### 3. ページネーション
顧客数が多い場合は、ページネーション機能の実装を検討してください。

## サポート
セットアップや運用で問題が発生した場合は、開発チームまでお問い合わせください。
