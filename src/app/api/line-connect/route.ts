import { NextRequest, NextResponse } from 'next/server';
import { findCustomerByEmail, updateCustomerLineId } from '@/lib/stripe';
import { LineLoginRequest, LineConnectResponse } from '@/types';

export async function POST(request: NextRequest): Promise<NextResponse<LineConnectResponse>> {
  try {
    const body: LineLoginRequest = await request.json();
    const { email, authorizationCode, state } = body;

    console.log('LINE連携リクエスト受信:', { email, authorizationCode, state });

    // 入力値の検証
    if (!email || !authorizationCode) {
      console.log('入力値検証失敗:', { email, authorizationCode });
      return NextResponse.json({
        success: false,
        message: 'メールアドレスとLINE認証情報は必須です。',
      }, { status: 400 });
    }

    // メールアドレスの形式検証
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        message: '有効なメールアドレスを入力してください。',
      }, { status: 400 });
    }

    // Stripeで顧客を検索
    console.log('Stripe顧客検索開始:', email);
    const customerSearch = await findCustomerByEmail(email);
    console.log('Stripe顧客検索結果:', customerSearch);
    
    if (!customerSearch.success) {
      console.log('顧客検索失敗:', customerSearch.message);
      return NextResponse.json({
        success: false,
        message: customerSearch.message || '顧客の検索に失敗しました。',
      }, { status: 404 });
    }

    const customer = customerSearch.customers[0];
    console.log('顧客情報:', customer);

    // 既にLINE IDが設定されているかチェック
    console.log('既存LINE IDチェック:', customer.metadata.lineId);
    if (customer.metadata.lineId) {
      console.log('既にLINE IDが設定済み');
      return NextResponse.json({
        success: false,
        message: 'このメールアドレスは既にLINE IDと紐づけられています。',
      }, { status: 409 });
    }

    // LINE IDを顧客のメタデータに追加
    const lineUserId = authorizationCode; // 実際にはこれはLINEユーザーIDになります
    console.log('LINE ID更新開始:', { customerId: customer.id, lineUserId });
    
    const updateSuccess = await updateCustomerLineId(customer.id, lineUserId);
    console.log('LINE ID更新結果:', updateSuccess);
    
    if (!updateSuccess) {
      console.log('LINE ID更新失敗');
      return NextResponse.json({
        success: false,
        message: 'LINE IDの更新に失敗しました。',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'LINE IDの連携が完了しました！',
      customerId: customer.id,
    });

  } catch (error) {
    console.error('LINE連携エラー:', error);
    return NextResponse.json({
      success: false,
      message: 'サーバーエラーが発生しました。',
    }, { status: 500 });
  }
}
