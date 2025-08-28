# コンバージョンシステム

Stripeの決済完了イベントを受け取り、コンバージョンデータをNEONデータベースに保存するシステムです。

## システム構成

### 1. データベース（NEON PostgreSQL）
- `Conversion`テーブル：コンバージョンデータを保存
- Prisma ORMを使用してデータベース操作を実行

### 2. APIエンドポイント

#### `/api/stripe-webhook`
- StripeからのWebhookイベントを受信
- `checkout.session.completed`イベントを処理
- コンバージョンデータをDBに保存

#### `/api/conversions`
- コンバージョンデータの取得
- フィルタリング・ページネーション対応
- 集計データも提供

#### `/api/conversions/export`
- コンバージョンデータをCSV形式でエクスポート
- フィルタリング条件に基づいてエクスポート

#### `/api/test-conversion`（テスト用）
- テスト用のコンバージョンデータを作成
- システムの動作確認用

### 3. 管理画面

#### `/admin-page-customer/conversions`
- コンバージョンデータの一覧表示
- フィルタリング機能（メールアドレス、日付範囲）
- サマリー情報（総コンバージョン数、総売上）
- CSVエクスポート機能
- ページネーション機能

## セットアップ手順

### 1. 依存関係のインストール

```bash
npm install prisma @prisma/client date-fns
```

### 2. 環境変数の設定

`.env`ファイルに以下を追加：

```bash
DATABASE_URL=your_neon_database_url
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### 3. データベースのセットアップ

```bash
npx prisma generate
npx prisma db push
```

### 4. Stripe Webhookの設定

詳細は`STRIPE_SETUP.md`を参照してください。

## 使用方法

### 1. システムの起動

```bash
npm run dev
```

### 2. 管理画面へのアクセス

ブラウザで `/admin-page-customer/conversions` にアクセス

### 3. テストデータの作成

```bash
curl -X POST http://localhost:3000/api/test-conversion
```

### 4. コンバージョンデータの確認

管理画面でコンバージョンデータが表示されることを確認

## データ構造

### Conversionテーブル

```sql
CREATE TABLE "Conversion" (
  "id" TEXT NOT NULL,
  "stripeEventId" TEXT NOT NULL,
  "customerEmail" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'jpy',
  "status" TEXT NOT NULL DEFAULT 'completed',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "Conversion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Conversion_stripeEventId_key" UNIQUE ("stripeEventId")
);

CREATE INDEX "Conversion_customerEmail_idx" ON "Conversion"("customerEmail");
CREATE INDEX "Conversion_createdAt_idx" ON "Conversion"("createdAt");
```

## フィルタリング機能

### メールアドレスフィルター
- 部分一致検索（大文字小文字を区別しない）
- 空の場合は全件表示

### 日付範囲フィルター
- 開始日のみ：指定日以降のデータ
- 終了日のみ：指定日以前のデータ
- 両方指定：指定範囲内のデータ

## エクスポート機能

### CSVエクスポート
- フィルタリング条件に基づいてエクスポート
- 日本語ヘッダー対応
- ファイル名に日付を含む

## セキュリティ

### Webhook認証
- Stripeの署名検証を実装
- 不正なリクエストを拒否

### データ検証
- 重複イベントのチェック
- 必須フィールドの検証

## トラブルシューティング

### よくある問題

1. **Webhookが受信されない**
   - Stripeの設定を確認
   - エンドポイントURLが正しいか確認

2. **データベースエラー**
   - 環境変数の設定を確認
   - Prismaスキーマの生成を確認

3. **管理画面が表示されない**
   - APIエンドポイントの動作を確認
   - ブラウザのコンソールでエラーを確認

### ログの確認

- サーバーサイドのログを確認
- ブラウザの開発者ツールでネットワークタブを確認

## 今後の拡張予定

- リアルタイム通知機能
- より詳細な分析機能
- 複数通貨対応
- バッチ処理による大量データ処理
