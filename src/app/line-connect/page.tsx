'use client';

import { useState, useEffect } from 'react';
import { LineLoginRequest, LineConnectResponse } from '@/types';

export default function LineConnectPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [lineUserInfo, setLineUserInfo] = useState<{
    userId: string;
    displayName: string;
    email: string;
  } | null>(null);
  const [state, setState] = useState<string>('');
  const [showFriendAddGuide, setShowFriendAddGuide] = useState(false);

  // URLパラメータからLINEログイン結果を取得
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const lineUserId = urlParams.get('lineUserId');
    const displayName = urlParams.get('displayName');
    const lineEmail = urlParams.get('email');
    const urlState = urlParams.get('state');
    const error = urlParams.get('error');
    const errorMessage = urlParams.get('error_description');

    if (error) {
      setMessage({
        type: 'error',
        text: errorMessage || 'LINEログインでエラーが発生しました。',
      });
      return;
    }

    if (lineUserId && displayName) {
      setLineUserInfo({
        userId: lineUserId,
        displayName: displayName,
        email: lineEmail || '',
      });
      
      // LINEから取得したメールアドレスがある場合はフォームに設定
      if (lineEmail) {
        setEmail(lineEmail);
      }
      
      setState(urlState || '');
      
      // 友達追加の案内を表示
      setShowFriendAddGuide(true);
    }
  }, []);

  // LINEログインボタンクリック時の処理
  const handleLineLogin = async () => {
    if (!email.trim()) {
      setMessage({
        type: 'error',
        text: 'メールアドレスを入力してください。',
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // サーバーサイドでLINEログインURLを生成
      const response = await fetch('/api/line-login-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        // stateとnonceをセッションストレージに保存（検証用）
        sessionStorage.setItem('line_login_state', data.state);
        sessionStorage.setItem('line_login_nonce', data.nonce);
        
        // LINEログインページにリダイレクト
        window.location.href = data.lineLoginUrl;
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'LINEログインURLの生成に失敗しました。',
        });
      }
    } catch {
      setMessage({
        type: 'error',
        text: '接続エラーが発生しました。もう一度お試しください。',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    if (!lineUserInfo) {
      setMessage({
        type: 'error',
        text: 'LINEログインを行ってください。',
      });
      setIsLoading(false);
      return;
    }

    try {
      const requestData: LineLoginRequest = {
        email: email.trim(),
        authorizationCode: lineUserInfo.userId, // LINEユーザーIDを使用
        state: state,
      };

      const response = await fetch('/api/line-connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data: LineConnectResponse = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: data.message,
        });
        // 成功時はフォームをクリア
        setEmail('');
        setLineUserInfo(null);
        setShowFriendAddGuide(false);
      } else {
        setMessage({
          type: 'error',
          text: data.message,
        });
      }
    } catch {
      setMessage({
        type: 'error',
        text: '接続エラーが発生しました。もう一度お試しください。',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 友達追加ボタンのクリック処理
  const handleAddFriend = () => {
    // LINE公式アカウントの友達追加URLを開く
    const lineAddFriendUrl = process.env.NEXT_PUBLIC_LINE_ADD_FRIEND_URL || 'https://line.me/R/ti/p/@your_line_id';
    window.open(lineAddFriendUrl, '_blank');
  };

  // 現在の段階に応じたタイトルと説明を取得
  const getPageTitle = () => {
    if (lineUserInfo) {
      return {
        title: 'LINE連携完了',
        description: 'LINEログインが完了しました。次に友達追加と連携を行ってください。'
      };
    }
    return {
      title: 'LINE連携開始',
      description: '決済完了後、LINE IDとメールアドレスを紐づけてください'
    };
  };

  const { title, description } = getPageTitle();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* 装飾的な背景要素 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-green-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg mx-auto">
          {/* メインカード */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            {/* ヘッダーセクション */}
            <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-12 text-center">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10">
                <div className="mx-auto h-20 w-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-6 border border-white/30">
                  {lineUserInfo ? (
                    <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-white mb-3">
                  {title}
                </h1>
                <p className="text-blue-100 text-lg">
                  {description}
                </p>
              </div>
            </div>

            {/* フォームセクション */}
            <div className="px-8 py-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* メールアドレス入力 */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">
                    決済時に使用したメールアドレス
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                      placeholder="example@email.com"
                      required
                      disabled={isLoading}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    決済時に使用したメールアドレスを入力してください
                  </p>
                </div>

                {/* LINEログインボタン */}
                {!lineUserInfo && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleLineLogin}
                      disabled={!email.trim() || isLoading}
                      className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63h2.386c.345 0 .63.285.63.63 0 .349-.285.63-.63.63H5.544v1.125h1.755c.345 0 .63.283.63.63 0 .344-.285.629-.63.629z"/>
                      </svg>
                      LINEでログイン
                    </button>
                    <p className="mt-3 text-sm text-gray-500">
                      メールアドレスを入力後、LINEでログインしてください
                    </p>
                  </div>
                )}

                {/* LINEログイン情報表示 */}
                {lineUserInfo && (
                  <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl shadow-sm">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-green-800">
                          LINEログイン完了
                        </h3>
                        <div className="mt-2 text-sm text-green-700">
                          <p className="font-medium">ユーザー名: {lineUserInfo.displayName}</p>
                          <p className="text-xs opacity-75">LINE ID: {lineUserInfo.userId}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 友達追加案内（LINEログイン完了後） */}
                {showFriendAddGuide && lineUserInfo && (
                  <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl shadow-sm">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-lg font-semibold text-blue-800 mb-3">
                          友達追加をお願いします
                        </h3>
                        <div className="text-sm text-blue-700 mb-4">
                          <p>
                            お得な情報や特別オファーを受け取るために、<br />
                            ぜひ友達追加をお願いします！
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddFriend}
                          className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                        >
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63h2.386c.345 0 .63.285.63.63 0 .349-.285.63-.63.63H5.544v1.125h1.755c.345 0 .63.283.63.63 0 .344-.285.629-.63.629z"/>
                          </svg>
                          友達追加する
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 連携ボタン（LINEログイン完了後のみ表示） */}
                {lineUserInfo && (
                  <>
                    {/* メッセージ表示 */}
                    {message && (
                      <div className={`p-4 rounded-2xl ${
                        message.type === 'success' 
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800' 
                          : 'bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-800'
                      }`}>
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            {message.type === 'success' ? (
                              <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium">{message.text}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex justify-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          処理中...
                        </div>
                      ) : (
                        'LINE IDを連携する'
                      )}
                    </button>
                  </>
                )}
              </form>

              {/* グローバルメッセージ表示（LINEログイン前後共通） */}
              {message && !lineUserInfo && (
                <div className={`p-4 rounded-2xl ${
                  message.type === 'success' 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800' 
                    : 'bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-800'
                }`}>
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {message.type === 'success' ? (
                        <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium">{message.text}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 注意事項 */}
              <div className="mt-8 p-6 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl shadow-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                      <svg className="h-6 w-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-amber-800 mb-3">
                      ご注意
                    </h3>
                    <div className="text-sm text-amber-700">
                      <ul className="space-y-2">
                        <li className="flex items-start">
                          <span className="inline-block w-2 h-2 bg-amber-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          まず「LINEでログイン」ボタンをクリックしてLINE認証を行ってください
                        </li>
                        <li className="flex items-start">
                          <span className="inline-block w-2 h-2 bg-amber-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          決済時に使用したメールアドレスを正確に入力してください
                        </li>
                        <li className="flex items-start">
                          <span className="inline-block w-2 h-2 bg-amber-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          LINE IDは一度連携すると変更できません
                        </li>
                        <li className="flex items-start">
                          <span className="inline-block w-2 h-2 bg-amber-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          友達追加後、LINE公式アカウントからお得な情報をお届けします
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
