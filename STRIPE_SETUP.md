# Stripe設定ガイド

## 必要な環境変数

`.env`ファイルに以下の環境変数を追加してください：

```bash
# Stripe設定
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
```

## Stripe Webhook設定手順

### 1. StripeダッシュボードでWebhookエンドポイントを作成

1. [Stripe Dashboard](https://dashboard.stripe.com/) にログイン
2. 左メニューから「Developers」→「Webhooks」を選択
3. 「Add endpoint」をクリック
4. エンドポイントURLを入力：
   ```
   https://your-domain.com/api/stripe-webhook
   ```
5. イベントタイプを選択：
   - `checkout.session.completed` を選択
6. 「Add endpoint」をクリック

### 2. Webhook Secret Keyを取得

1. 作成したWebhookエンドポイントをクリック
2. 「Signing secret」セクションで「Reveal」をクリック
3. 表示されたシークレットキーをコピー
4. `.env`ファイルの`STRIPE_WEBHOOK_SECRET`に設定

### 3. テスト用のWebhook設定（開発環境）

開発環境でテストする場合は、Stripe CLIを使用：

```bash
# Stripe CLIをインストール
npm install -g stripe

# ログイン
stripe login

# Webhookをローカルでリッスン
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

## 動作確認

### 1. テスト決済を作成

Stripeダッシュボードでテスト決済を作成し、Webhookが正常に動作することを確認

### 2. ログの確認

Webhookエンドポイントのログを確認し、コンバージョンデータが正常にDBに保存されることを確認

### 3. 管理画面での確認

`/admin-page-customer/conversions` ページでコンバージョンデータが表示されることを確認

## トラブルシューティング

### Webhookが受信されない場合

1. エンドポイントURLが正しいか確認
2. イベントタイプが正しく選択されているか確認
3. Webhook Secret Keyが正しく設定されているか確認

### データベースエラーが発生する場合

1. `DATABASE_URL`が正しく設定されているか確認
2. Prismaスキーマが正しく生成されているか確認
3. データベースの接続が正常か確認

## セキュリティ注意事項

- `STRIPE_SECRET_KEY`と`STRIPE_WEBHOOK_SECRET`は絶対に公開リポジトリにコミットしないでください
- 本番環境では適切なシークレット管理サービスを使用してください
- Webhookエンドポイントは適切な認証・認可を実装してください
