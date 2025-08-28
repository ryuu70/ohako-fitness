'use client'

import { useState } from 'react'

export default function TestPage() {
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)

  const createTestConversion = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/test-conversion', {
        method: 'POST'
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'エラーが発生しました', details: error })
    } finally {
      setLoading(false)
    }
  }

  const viewConversions = () => {
    window.open('/admin-page-customer/conversions', '_blank')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">テストページ</h1>
      
      <div className="space-y-6">
        {/* テストコンバージョン作成 */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">テストコンバージョンの作成</h2>
          <button
            onClick={createTestConversion}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '作成中...' : 'テストコンバージョンを作成'}
          </button>
        </div>

        {/* 結果表示 */}
        {result && (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">実行結果</h3>
            <pre className="bg-white p-4 rounded border overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {/* 管理画面へのリンク */}
        <div className="bg-green-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">管理画面</h2>
          <button
            onClick={viewConversions}
            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700"
          >
            コンバージョン管理画面を開く
          </button>
        </div>

        {/* 使用方法 */}
        <div className="bg-yellow-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">使用方法</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>「テストコンバージョンを作成」ボタンをクリック</li>
            <li>実行結果を確認</li>
            <li>「コンバージョン管理画面を開く」でデータを確認</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
