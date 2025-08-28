export default function SuccessPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-green-50 p-8 rounded-lg border border-green-200">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-green-800 mb-4">
            決済が完了しました！
          </h1>
          <p className="text-lg text-green-700 mb-6">
            テスト決済が正常に完了しました。Webhookが受信され、コンバージョンデータが作成されているはずです。
          </p>
          
          <div className="space-y-4">
            <a
              href="/admin-page-customer/conversions"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700"
            >
              コンバージョン管理画面で確認
            </a>
            
            <a
              href="/stripe-test"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 ml-4"
            >
              再度テストする
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
