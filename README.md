# Ohako Fitness - LINE連携サービス

フィットネスサービスとLINEを連携して、お得な情報をお届けします。

## 機能

- LINEログインによるユーザー認証
- Stripe決済との連携
- LINE公式アカウントへの友達追加
- パーソナライズされたフィットネス情報の配信

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```env
# Stripe設定
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# LINE設定
LINE_CHANNEL_ID=your_line_channel_id_here
LINE_CHANNEL_SECRET=your_line_channel_secret_here
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token_here

# アプリケーション設定
NEXT_PUBLIC_APP_URL=http://localhost:3000

# LINE友達追加URL（重要！）
NEXT_PUBLIC_LINE_ADD_FRIEND_URL=https://line.me/R/ti/p/@your_line_id

# Meta Conversions API設定
META_ACCESS_TOKEN=your_meta_access_token_here
META_PIXEL_ID=your_meta_pixel_id_here
```

### 3. LINE友達追加URLの設定

`NEXT_PUBLIC_LINE_ADD_FRIEND_URL`には、あなたのLINE公式アカウントの友達追加URLを設定してください。

友達追加URLの取得方法：
1. LINE Developersコンソールにログイン
2. あなたのチャネルを選択
3. 「Messaging API設定」タブを開く
4. 「友だち追加用URL」をコピー

### 4. 開発サーバーの起動

```bash
npm run dev
```

## 使用方法

1. トップページ（`/`）にアクセスすると、自動的にLINE連携ページ（`/line-connect`）にリダイレクトされます
2. 決済時に使用したメールアドレスを入力
3. LINEでログイン
4. LINE公式アカウントに友達追加
5. LINE IDとメールアドレスの連携完了

## API エンドポイント

- `POST /api/line-login-url` - LINEログインURLの生成
- `GET /api/line-callback` - LINEログインコールバック処理
- `POST /api/line-connect` - LINE IDとメールアドレスの連携
- `GET /api/debug/env-check` - 環境変数の確認
- `GET /api/debug/stripe-customer` - Stripe顧客検索のテスト
- `POST /api/stripe-webhook` - Stripe決済イベントの処理（Meta API連携含む）
- `POST /api/test-meta-conversion` - Meta Conversions APIのテスト送信
- `GET /api/test-meta-conversion` - Meta API設定の確認

## 技術スタック

- Next.js 15.5.0
- React 19.1.0
- TypeScript
- Tailwind CSS v4
- Stripe API
- LINE Login API

## Meta Conversions API連携

Stripeの決済完了イベントを自動的にMeta広告のコンバージョンとして送信します。

### 機能
- Stripe決済完了時に自動でMeta Conversions APIにデータを送信
- 既存のコンバージョン計測機能はそのまま維持
- メールアドレスと電話番号のハッシュ化によるプライバシー保護
- エラー時も決済処理に影響しない安全な実装

### テスト方法
```bash
# Meta API設定の確認
curl http://localhost:3000/api/test-meta-conversion

# テストコンバージョンの送信
curl -X POST http://localhost:3000/api/test-meta-conversion
```

## 注意事項

- LINE IDは一度連携すると変更できません
- 友達追加後、LINE公式アカウントからお得な情報をお届けします
- 決済時に使用したメールアドレスを正確に入力してください
- Meta APIの認証情報は必ず設定してください
