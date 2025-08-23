'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface CustomerData {
  customerId: string;
  lineId: string;
  email: string;
  subscriptionStatus: string;
  subscriptionName: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
  paymentStatus: string;
  [key: string]: string | number | boolean | undefined; // インデックスシグネチャを追加
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  
  // フィルタリングとソートの状態
  const [statusFilter, setStatusFilter] = useState('active');
  const [sortBy, setSortBy] = useState('subscriptionStatus');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // 元のデータ（フィルタリング前）
  const [originalCustomers, setOriginalCustomers] = useState<CustomerData[]>([]);
  
  // CSV出力項目の選択状態
  const [csvExportFields, setCsvExportFields] = useState({
    customerId: true,
    lineId: true,
    email: true,
    subscriptionName: true,
    subscriptionStatus: true,
    paymentStatus: true,
    currentPeriodStart: true,
    currentPeriodEnd: true,
    createdAt: true,
    lineConnectionStatus: true
  });
  
  // フィルタリングとソートをローカルで適用
  const applyFiltersAndSort = useCallback(() => {
    let filteredCustomers = [...originalCustomers];
    
    // 契約状況でフィルタリング
    if (statusFilter !== 'all') {
      filteredCustomers = filteredCustomers.filter(customer => 
        customer.subscriptionStatus === statusFilter
      );
    }
    
    // ソートを適用
    filteredCustomers.sort((a, b) => {
      let aValue: string | number = a[sortBy as keyof CustomerData] as string | number;
      let bValue: string | number = b[sortBy as keyof CustomerData] as string | number;

      // 日付フィールドの場合はDateオブジェクトに変換
      if (sortBy === 'createdAt' || sortBy === 'currentPeriodStart' || sortBy === 'currentPeriodEnd') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }

      // 数値フィールドの場合は数値として比較
      if (sortBy === 'currentPeriodStart' || sortBy === 'currentPeriodEnd') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      }

      if (aValue < bValue) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    setCustomers(filteredCustomers);
  }, [originalCustomers, statusFilter, sortBy, sortOrder]);

  // フィルタリングとソートの状態が変更されたときにローカルで適用
  useEffect(() => {
    if (originalCustomers.length > 0) {
      applyFiltersAndSort();
    }
  }, [applyFiltersAndSort, originalCustomers.length]);

  // 顧客データの取得
  const fetchCustomers = useCallback(async () => {
    try {
      console.log('顧客データ取得開始...');
      
      // クエリパラメータを構築
      const params = new URLSearchParams({
        status: statusFilter,
        sortBy: sortBy,
        sortOrder: sortOrder
      });
      
      const response = await fetch(`/api/admin/customers?${params}`);
      console.log('APIレスポンス:', response);
      
      const data = await response.json();
      console.log('APIレスポンスデータ:', data);

      if (data.success) {
        console.log('顧客データ取得成功:', data.customers);
        setOriginalCustomers(data.customers); // フィルタリング前のデータを保存
      } else {
        console.error('顧客データ取得失敗:', data.message);
        setMessage({
          type: 'error',
          text: data.message || '顧客データの取得に失敗しました。',
        });
      }
    } catch (error) {
      console.error('顧客データ取得中にエラーが発生:', error);
      setMessage({
        type: 'error',
        text: '顧客データの取得中にエラーが発生しました。',
      });
    }
  }, [statusFilter, sortBy, sortOrder]);

  // 認証状態の確認
  useEffect(() => {
    const authStatus = sessionStorage.getItem('admin_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      fetchCustomers();
    }
  }, [fetchCustomers]);

  // パスワード認証
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setMessage({
        type: 'error',
        text: 'パスワードを入力してください。',
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem('admin_authenticated', 'true');
        setMessage({
          type: 'success',
          text: '認証が完了しました。',
        });
        fetchCustomers();
      } else {
        let errorMessage = data.message || 'パスワードが正しくありません。';
        
        // レート制限の情報を追加
        if (data.remainingAttempts !== undefined) {
          if (data.remainingAttempts > 0) {
            errorMessage += ` (残り試行回数: ${data.remainingAttempts}回)`;
          } else if (data.resetTime) {
            const resetTime = new Date(data.resetTime).toLocaleString('ja-JP');
            errorMessage += ` (ブロック解除時刻: ${resetTime})`;
          }
        }
        
        setMessage({
          type: 'error',
          text: errorMessage,
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: '認証エラーが発生しました。',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // CSV出力
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      // 選択された項目をクエリパラメータとして送信
      const selectedFields = Object.entries(csvExportFields)
        .filter(([_key, isSelected]) => isSelected)
        .map(([field, _value]) => field)
        .join(',');
      
      const response = await fetch(`/api/admin/export-csv?fields=${selectedFields}`);
      const blob = await response.blob();
      
      // CSVファイルのダウンロード
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({
        type: 'success',
        text: 'CSVファイルの出力が完了しました。',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'CSV出力中にエラーが発生しました。',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // ログアウト
  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
    setCustomers([]);
    setMessage(null);
  };

  // 認証前のログイン画面
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-10 text-center">
              <div className="mx-auto h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mb-6">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                管理者ログイン
              </h1>
              <p className="text-blue-100">
                パスワードを入力してログインしてください
              </p>
            </div>

            <div className="px-8 py-8">
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    パスワード
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="パスワードを入力"
                    required
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      認証中...
                    </div>
                  ) : (
                    'ログイン'
                  )}
                </button>
              </form>

              {message && (
                <div className={`mt-6 p-4 rounded-lg ${
                  message.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-800' 
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {message.type === 'success' ? (
                        <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm">{message.text}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 認証後の管理画面
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* ヘッダー */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      管理者ダッシュボード
                    </h1>
                    <p className="text-blue-100">
                      サブスクライブ契約継続中の顧客管理
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                >
                  ログアウト
                </button>
              </div>
            </div>
          </div>

          {/* 統計情報 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">総顧客数</p>
                  <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">LINE連携済み</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {customers.filter(c => c.lineId).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">LINE未連携</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {customers.filter(c => !c.lineId).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* フィルタリングとソート */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">フィルタリングとソート</h3>
              <p className="text-sm text-gray-600">
                設定を変更すると即座に反映されます。最新のデータを取得するには「更新」ボタンを押してください。
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div>
                  <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-2">
                    契約状況
                  </label>
                  <select
                    id="statusFilter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">アクティブ</option>
                    <option value="trialing">トライアル中</option>
                    <option value="past_due">支払い遅延</option>
                    <option value="canceled">キャンセル済み</option>
                    <option value="all">すべて</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-2">
                    ソート項目
                  </label>
                  <select
                    id="sortBy"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="subscriptionStatus">契約状況</option>
                    <option value="email">メールアドレス</option>
                    <option value="createdAt">作成日</option>
                    <option value="currentPeriodStart">契約開始日</option>
                    <option value="currentPeriodEnd">契約終了日</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-2">
                    ソート順序
                  </label>
                  <select
                    id="sortOrder"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="asc">昇順</option>
                    <option value="desc">降順</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={fetchCustomers}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                    title="最新のデータを取得してフィルタリングとソートを再適用します"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        更新中...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        更新
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-500">
                表示件数: {customers.length}件
              </div>
            </div>
          </div>

          {/* CSV出力項目選択 */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">CSV出力項目選択</h3>
              <p className="text-sm text-gray-600">
                出力したい項目を選択してください。選択された項目のみがCSVに出力されます。
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={csvExportFields.customerId}
                  onChange={(e) => setCsvExportFields(prev => ({ ...prev, customerId: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">顧客ID</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={csvExportFields.lineId}
                  onChange={(e) => setCsvExportFields(prev => ({ ...prev, lineId: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">LINE ID</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={csvExportFields.email}
                  onChange={(e) => setCsvExportFields(prev => ({ ...prev, email: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">メールアドレス</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={csvExportFields.subscriptionName}
                  onChange={(e) => setCsvExportFields(prev => ({ ...prev, subscriptionName: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">サブスクリプション名</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={csvExportFields.subscriptionStatus}
                  onChange={(e) => setCsvExportFields(prev => ({ ...prev, subscriptionStatus: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">契約状況</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={csvExportFields.paymentStatus}
                  onChange={(e) => setCsvExportFields(prev => ({ ...prev, paymentStatus: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">支払い状況</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={csvExportFields.currentPeriodStart}
                  onChange={(e) => setCsvExportFields(prev => ({ ...prev, currentPeriodStart: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">契約開始日</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={csvExportFields.currentPeriodEnd}
                  onChange={(e) => setCsvExportFields(prev => ({ ...prev, currentPeriodEnd: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">契約終了日</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={csvExportFields.createdAt}
                  onChange={(e) => setCsvExportFields(prev => ({ ...prev, createdAt: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">作成日</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={csvExportFields.lineConnectionStatus}
                  onChange={(e) => setCsvExportFields(prev => ({ ...prev, lineConnectionStatus: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">LINE連携状況</span>
              </label>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <div className="flex space-x-2">
                <button
                  onClick={() => setCsvExportFields({
                    customerId: true,
                    lineId: true,
                    email: true,
                    subscriptionName: true,
                    subscriptionStatus: true,
                    paymentStatus: true,
                    currentPeriodStart: true,
                    currentPeriodEnd: true,
                    createdAt: true,
                    lineConnectionStatus: true
                  })}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                >
                  すべて選択
                </button>
                <button
                  onClick={() => setCsvExportFields({
                    customerId: false,
                    lineId: false,
                    email: false,
                    subscriptionName: false,
                    subscriptionStatus: false,
                    paymentStatus: false,
                    currentPeriodStart: false,
                    currentPeriodEnd: false,
                    createdAt: false,
                    lineConnectionStatus: false
                  })}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                >
                  すべて解除
                </button>
              </div>
              
              <div className="text-sm text-gray-500">
                選択項目数: {Object.values(csvExportFields).filter(Boolean).length} / 10
              </div>
            </div>
          </div>

          {/* メインコンテンツ */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  顧客一覧
                </h2>
                <button
                  onClick={handleExportCSV}
                  disabled={isExporting || customers.length === 0 || Object.values(csvExportFields).filter(Boolean).length === 0}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {isExporting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      出力中...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414L11.414 10l1.293-1.293a1 1 0 001.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      CSV出力
                    </>
                  )}
                </button>
              </div>
              
              {Object.values(csvExportFields).filter(Boolean).length === 0 && (
                <div className="mt-2 text-sm text-red-600">
                  CSV出力項目を選択してください
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      顧客ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      LINE ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      メールアドレス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      契約状況
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      作成日
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((customer, index) => (
                    <tr key={customer.customerId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {customer.customerId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.lineId ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {customer.lineId}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            未連携
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          customer.subscriptionStatus === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : customer.subscriptionStatus === 'trialing'
                            ? 'bg-blue-100 text-blue-800'
                            : customer.subscriptionStatus === 'past_due'
                            ? 'bg-yellow-100 text-yellow-800'
                            : customer.subscriptionStatus === 'canceled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {customer.subscriptionStatus === 'active' ? 'アクティブ' :
                           customer.subscriptionStatus === 'trialing' ? 'トライアル中' :
                           customer.subscriptionStatus === 'past_due' ? '支払い遅延' :
                           customer.subscriptionStatus === 'canceled' ? 'キャンセル済み' :
                           customer.subscriptionStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(customer.createdAt).toLocaleDateString('ja-JP')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {customers.length === 0 && (
              <div className="px-8 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">顧客データがありません</h3>
                <p className="mt-1 text-sm text-gray-500">
                  サブスクライブ契約が継続中の顧客データが表示されます。
                </p>
              </div>
            )}
          </div>

          {/* メッセージ表示 */}
          {message && (
            <div className={`mt-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {message.type === 'success' ? (
                    <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm">{message.text}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
