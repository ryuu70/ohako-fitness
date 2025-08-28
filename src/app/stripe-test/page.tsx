'use client'

import { useState } from 'react'

export default function StripeTestPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const createCheckoutSession = async () => {
    try {
      setLoading(true)
      setMessage('')

      // 実際のStripe Checkoutセッションを作成するAPIを呼び出し
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: 'price_test', // テスト用の価格ID
          successUrl: `${window.location.origin}/stripe-test/success`,
          cancelUrl: `${window.location.origin}/stripe-test/cancel`,
        }),
      })

      const { sessionId } = await response.json()
      
      // Stripe Checkoutにリダイレクト
      const stripe = await loadStripe()
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId })
        if (error) {
          setMessage(`エラー: ${error.message}`)
        }
      }
    } catch (error) {
      setMessage(`エラー: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Stripe Checkout テスト</h1>
      
      <div className="max-w-2xl mx-auto space-y-6">
        {/* テスト商品情報 */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">テスト商品</h2>
          <div className="space-y-2">
            <p><strong>商品名:</strong> テスト商品</p>
            <p><strong>価格:</strong> ¥1,000</p>
            <p><strong>説明:</strong> Stripe Checkoutのテスト用商品です</p>
          </div>
        </div>

        {/* テスト用カード情報 */}
        <div className="bg-yellow-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">テスト用カード番号</h2>
          <div className="space-y-2">
            <p><strong>成功:</strong> 4242 4242 4242 4242</p>
            <p><strong>失敗:</strong> 4000 0000 0000 0002</p>
            <p><strong>有効期限:</strong> 任意の将来の日付</p>
            <p><strong>CVC:</strong> 任意の3桁の数字</p>
          </div>
        </div>

        {/* チェックアウトボタン */}
        <div className="bg-green-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">チェックアウト</h2>
          <button
            onClick={createCheckoutSession}
            disabled={loading}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '処理中...' : 'チェックアウトを開始'}
          </button>
        </div>

        {/* メッセージ表示 */}
        {message && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-red-800">{message}</p>
          </div>
        )}

        {/* 使用方法 */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">使用方法</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>「チェックアウトを開始」ボタンをクリック</li>
            <li>Stripe Checkoutページでテスト用カード情報を入力</li>
            <li>決済を完了</li>
            <li>Webhookが受信され、コンバージョンデータが作成される</li>
            <li>管理画面でデータを確認</li>
          </ol>
        </div>

        {/* 管理画面へのリンク */}
        <div className="bg-purple-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">管理画面</h2>
          <a
            href="/admin-page-customer/conversions"
            className="inline-block bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700"
          >
            コンバージョン管理画面を開く
          </a>
        </div>
      </div>
    </div>
  )
}

// Stripeの読み込み（実際の実装では適切なライブラリを使用）
async function loadStripe(): Promise<{
  redirectToCheckout: (options: { sessionId: string }) => Promise<{ error?: { message: string } }>;
} | null> {
  // ここでは簡易的な実装
  return null
}
