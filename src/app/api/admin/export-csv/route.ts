import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Stripeインスタンスの初期化（最新のAPIバージョンを使用）
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export async function GET(request: NextRequest) {
  try {
    // クエリパラメータから出力項目を取得
    const { searchParams } = new URL(request.url);
    const fieldsParam = searchParams.get('fields');
    
    // デフォルトの出力項目（すべて）
    const defaultFields = [
      'customerId',
      'lineId', 
      'email',
      'subscriptionName',
      'subscriptionStatus',
      'paymentStatus',
      'currentPeriodStart',
      'currentPeriodEnd',
      'createdAt',
      'lineConnectionStatus'
    ];
    
    // 出力項目を決定
    let selectedFields: string[];
    if (fieldsParam) {
      selectedFields = fieldsParam.split(',').filter(field => defaultFields.includes(field));
      // 項目が指定されていない場合はデフォルトを使用
      if (selectedFields.length === 0) {
        selectedFields = defaultFields;
      }
    } else {
      selectedFields = defaultFields;
    }
    
    console.log('CSV出力項目:', selectedFields);

    // サブスクリプション一覧を取得
    // 継続中の判断基準：
    // - status: 'active' - アクティブなサブスクリプション
    // - status: 'trialing' - トライアル期間中
    // - status: 'past_due' - 支払い遅延中（継続扱い）
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      expand: ['data.customer'],
      limit: 100,
    });

    // 過去の支払い遅延があるが継続中のサブスクリプションも取得
    const pastDueSubscriptions = await stripe.subscriptions.list({
      status: 'past_due',
      expand: ['data.customer'],
      limit: 100,
    });

    // トライアル期間中のサブスクリプションも取得
    const trialingSubscriptions = await stripe.subscriptions.list({
      status: 'trialing',
      expand: ['data.customer'],
      limit: 100,
    });

    // すべての継続中のサブスクリプションを結合
    const allSubscriptions = [
      ...subscriptions.data,
      ...pastDueSubscriptions.data,
      ...trialingSubscriptions.data
    ];

    // 顧客データを整形
    const customers = await Promise.all(
      allSubscriptions.map(async (subscription) => {
        const customer = subscription.customer as Stripe.Customer;
        
        // StripeのメタデータからLINE連携情報を取得
        const lineId = await getLineIdFromStripe(customer.id);
        
        // サブスクリプションの詳細情報を取得
        const subscriptionDetails = await getSubscriptionDetails(subscription.id);
        
        // 期間情報を安全に取得
        const currentPeriodStart = (subscription as Stripe.Subscription & { current_period_start?: number }).current_period_start 
          ? new Date((subscription as Stripe.Subscription & { current_period_start?: number }).current_period_start! * 1000).toISOString()
          : new Date().toISOString();
          
        const currentPeriodEnd = (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end
          ? new Date((subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end! * 1000).toISOString()
          : new Date().toISOString();
        
        return {
          customerId: customer.id,
          lineId: lineId || '',
          email: customer.email || '',
          subscriptionStatus: subscription.status,
          subscriptionName: subscriptionDetails.name || '不明',
          currentPeriodStart: currentPeriodStart,
          currentPeriodEnd: currentPeriodEnd,
          createdAt: new Date(customer.created * 1000).toISOString(),
          // 支払い状況
          paymentStatus: getPaymentStatus(subscription.status),
        };
      })
    );

    // 重複する顧客を除去（同じ顧客が複数のサブスクリプションを持っている場合）
    const uniqueCustomers = customers.filter((customer, index, self) => 
      index === self.findIndex(c => c.customerId === customer.customerId)
    );

    // CSVヘッダーの定義
    const fieldLabels: { [key: string]: string } = {
      customerId: '顧客ID',
      lineId: 'LINE ID',
      email: 'メールアドレス',
      subscriptionName: 'サブスクリプション名',
      subscriptionStatus: '契約状況',
      paymentStatus: '支払い状況',
      currentPeriodStart: '現在の期間開始日',
      currentPeriodEnd: '現在の期間終了日',
      createdAt: '作成日',
      lineConnectionStatus: 'LINE連携状況'
    };

    // 選択された項目のヘッダーを生成
    const csvHeaders = selectedFields.map(field => fieldLabels[field]);

    // CSVデータ行を生成
    const csvRows = uniqueCustomers.map(customer => {
      const row: string[] = [];
      
      selectedFields.forEach(field => {
        switch (field) {
          case 'customerId':
            row.push(customer.customerId);
            break;
          case 'lineId':
            row.push(customer.lineId || '');
            break;
          case 'email':
            row.push(customer.email);
            break;
          case 'subscriptionName':
            row.push(customer.subscriptionName);
            break;
          case 'subscriptionStatus':
            row.push(customer.subscriptionStatus);
            break;
          case 'paymentStatus':
            row.push(customer.paymentStatus);
            break;
          case 'currentPeriodStart':
            row.push(new Date(customer.currentPeriodStart).toLocaleDateString('ja-JP'));
            break;
          case 'currentPeriodEnd':
            row.push(new Date(customer.currentPeriodEnd).toLocaleDateString('ja-JP'));
            break;
          case 'createdAt':
            row.push(new Date(customer.createdAt).toLocaleDateString('ja-JP'));
            break;
          case 'lineConnectionStatus':
            row.push(customer.lineId ? '連携済み' : '未連携');
            break;
          default:
            row.push('');
        }
      });
      
      return row;
    });

    // CSVコンテンツを生成
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    // BOMを追加して日本語文字化けを防ぐ
    const bom = '\uFEFF';
    const csvWithBom = bom + csvContent;

    // CSVファイルとしてレスポンス
    return new NextResponse(csvWithBom, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="customers_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('CSV出力エラー:', error);
    return NextResponse.json(
      { success: false, message: 'CSV出力に失敗しました。' },
      { status: 500 }
    );
  }
}

// StripeからLINE連携情報を取得
async function getLineIdFromStripe(customerId: string): Promise<string | null> {
  try {
    // 顧客のメタデータからLINE IDを取得
    const customer = await stripe.customers.retrieve(customerId);
    
    if (customer.deleted) {
      return null;
    }

    // メタデータからLINE IDを取得
    const lineId = customer.metadata.line_id || customer.metadata.lineId || customer.metadata.line_user_id;
    
    if (lineId) {
      return lineId;
    }

    // 顧客のサブスクリプションからも確認
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
    });

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      const subscriptionLineId = subscription.metadata.line_id || subscription.metadata.lineId || subscription.metadata.line_user_id;
      return subscriptionLineId || null;
    }

    return null;
  } catch (error) {
    console.error('LINE ID取得エラー:', error);
    return null;
  }
}

// サブスクリプションの詳細情報を取得
async function getSubscriptionDetails(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product']
    });

    if (subscription.items.data.length > 0) {
      const item = subscription.items.data[0];
      const product = item.price.product as Stripe.Product;
      
      return {
        name: product.name || '不明',
        description: product.description || '',
        price: item.price.unit_amount ? (item.price.unit_amount / 100) : 0,
        currency: item.price.currency || 'jpy',
        interval: item.price.recurring?.interval || 'month',
        intervalCount: item.price.recurring?.interval_count || 1,
      };
    }

    return { name: '不明' };
  } catch (error) {
    console.error('サブスクリプション詳細取得エラー:', error);
    return { name: '不明' };
  }
}

// 支払い状況を日本語で返す
function getPaymentStatus(status: string): string {
  switch (status) {
    case 'active':
      return 'アクティブ';
    case 'trialing':
      return 'トライアル中';
    case 'past_due':
      return '支払い遅延';
    case 'canceled':
      return 'キャンセル済み';
    case 'unpaid':
      return '未払い';
    case 'incomplete':
      return '未完了';
    case 'incomplete_expired':
      return '期限切れ';
    default:
      return status;
  }
}
