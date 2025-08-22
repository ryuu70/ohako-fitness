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
  const [friendAddExecuted, setFriendAddExecuted] = useState(false);
  const [countdown, setCountdown] = useState(5);

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
      
      // LINEログイン完了後、自動的に友達追加ページを開く
      setTimeout(() => {
        handleAddFriend();
      }, 1000); // 1秒後に友達追加を実行
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
          text: 'LINE連携が完了しました！友達追加ページに自動で遷移します。',
        });
        
        // 成功時は即座に友達追加ページに遷移
        setTimeout(() => {
          handleAddFriend();
        }, 500); // 0.5秒後に友達追加を実行
        
        // 友達追加実行後、フォームをクリア
        setTimeout(() => {
          setEmail('');
          setLineUserInfo(null);
          setShowFriendAddGuide(false);
        }, 1000);
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
    try {
      // LINE公式アカウントの友達追加URLを開く
      const lineAddFriendUrl = process.env.NEXT_PUBLIC_LINE_ADD_FRIEND_URL || 'https://s.lmes.jp/landing-qr/2007884698-P157Mx1x?uLand=GM7TbC';
      
      // 新しいタブで友達追加ページを開く
      const newWindow = window.open(lineAddFriendUrl, '_blank');
      
      // ポップアップブロッカーが有効な場合の処理
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // ポップアップがブロックされた場合、現在のタブで開く
        window.location.href = lineAddFriendUrl;
      }
      
      // 友達追加実行フラグを設定
      setFriendAddExecuted(true);
      
      // カウントダウン開始（より短い時間に設定）
      let remainingTime = 3;
      const countdownInterval = setInterval(() => {
        remainingTime -= 1;
        setCountdown(remainingTime);
        
        if (remainingTime <= 0) {
          clearInterval(countdownInterval);
          // 友達追加完了後、ホームページにリダイレクト
          window.location.href = 'https://ohako-fitness.com/';
        }
      }, 1000);
    } catch (error) {
      console.error('友達追加ページの開設に失敗しました:', error);
      // エラーが発生した場合、直接URLに遷移
      const lineAddFriendUrl = process.env.NEXT_PUBLIC_LINE_ADD_FRIEND_URL || 'https://s.lmes.jp/landing-qr/2007884698-P157Mx1x?uLand=GM7TbC';
      window.location.href = lineAddFriendUrl;
    }
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
      description: 'LINE IDとメールアドレスを紐づけてください'
    };
  };

  const { title, description } = getPageTitle();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          {/* メインカード */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* ヘッダーセクション */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-10 text-center">
              <div className="mx-auto h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mb-6">
                {lineUserInfo ? (
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {title}
              </h1>
              <p className="text-blue-100">
                {description}
              </p>
            </div>

            {/* フォームセクション */}
            <div className="px-8 py-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* メールアドレス入力 */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    決済時に使用したメールアドレス
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="example@email.com"
                    required
                    disabled={isLoading}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    決済時に使用したメールアドレスを入力してください
                  </p>
                </div>

                {/* LINE IDとメールアドレスの紐付けメリット説明 */}
                {!lineUserInfo && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-blue-800 mb-3">
                          LINE IDとメールアドレスの紐付けについて
                        </h3>
                        <div className="text-xs text-blue-700 space-y-2">
                          <p className="flex items-start">
                            <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                            サポートスタッフが個別連絡（施設の質問など）に対応いたします
                          </p>
                          <p className="flex items-start">
                            <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                            ご連絡いただいたLINE IDとOHAKO fitness studio会員の情報を即時照会できるため、お問い合わせ内容の詳細をスムーズに確認できます
                          </p>
                          <p className="flex items-start">
                            <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                            新しいプログラム公開・営業日時の変更など、大切なお知らせを確実にお受け取り頂けます
                          </p>
                          <p className="flex items-start">
                            <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                            今後の会員限定特典や招待制度などの対象になります
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* LINEログインボタン */}
                {!lineUserInfo && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleLineLogin}
                      disabled={!email.trim() || isLoading}
                      className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63h2.386c.345 0 .63.285.63.63 0 .349-.285.63-.63.63H5.544v1.125h1.755c.345 0 .63.283.63.63 0 .344-.285.629-.63.629z"/>
                      </svg>
                      LINEでログイン
                    </button>
                    <p className="mt-2 text-xs text-gray-500">
                      メールアドレスを入力後、LINEでログインしてください
                    </p>
                  </div>
                )}

                {/* LINEログイン情報表示 */}
                {lineUserInfo && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-green-800">
                          LINEログイン完了
                        </h3>
                        <div className="text-xs text-green-700">
                          <p>ユーザー名: {lineUserInfo.displayName}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 友達追加案内（LINEログイン完了後） */}
                {showFriendAddGuide && lineUserInfo && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-blue-800 mb-2">
                          友達追加をお願いします
                        </h3>
                        <p className="text-xs text-blue-700 mb-3">
                          お得な情報や特別オファーを受け取るために、ぜひ友達追加をお願いします！
                        </p>
                        <button
                          type="button"
                          onClick={handleAddFriend}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-xs font-medium rounded-lg text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
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
                      <div className={`p-4 rounded-lg ${
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
                          処理中...
                        </div>
                      ) : (
                        'LINE IDを連携する'
                      )}
                    </button>
                  </>
                )}
              </form>

              {/* 友達追加完了の案内メッセージ */}
              {friendAddExecuted && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        友達追加が完了しました！
                      </h3>
                      <p className="text-sm text-blue-700 mt-1">
                        {countdown}秒後にホームページにリダイレクトします...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* グローバルメッセージ表示（LINEログイン前後共通） */}
              {message && !lineUserInfo && (
                <div className={`p-4 rounded-lg ${
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

              {/* 注意事項 */}
              {!lineUserInfo && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex">
                    <div className="h-6 w-6 bg-amber-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="h-4 w-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-amber-800 mb-2">
                        ご注意
                      </h3>
                      <div className="text-xs text-amber-700 space-y-1">
                        <p>• 決済時に入力したメールアドレスを正確に入力してください</p>
                        <p>• 「LINEでログイン」ボタンをクリックしてLINE認証を行ってください。</p>
                        <p>• LINE IDは一度連携すると変更できません</p>
                        <p>• 友達追加後、LINE公式アカウントからお得な情報をお届けします</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
