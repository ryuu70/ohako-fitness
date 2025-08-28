export default function CancelPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-yellow-50 p-8 rounded-lg border border-yellow-200">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-3xl font-bold text-yellow-800 mb-4">
            決済がキャンセルされました
          </h1>
          <p className="text-lg text-yellow-700 mb-6">
            決済がキャンセルされました。再度お試しください。
          </p>
          
          <div className="space-y-4">
            <a
              href="/stripe-test"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
            >
              再度テストする
            </a>
            
            <a
              href="/admin-page-customer/conversions"
              className="inline-block bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 ml-4"
            >
              管理画面に戻る
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
