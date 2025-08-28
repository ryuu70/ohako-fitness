import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// 顧客データの型定義
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
}

/**
 * 顧客データ取得API
 * 
 * クエリパラメータ:
 * - status: 契約状況フィルタ ('active', 'trialing', 'past_due', 'canceled', 'all')
 *   - デフォルト: 'active' (アクティブな契約のみ表示)
 * - sortBy: ソート項目 ('subscriptionStatus', 'email', 'createdAt', 'currentPeriodStart', 'currentPeriodEnd')
 *   - デフォルト: 'subscriptionStatus'
 * - sortOrder: ソート順序 ('asc', 'desc')
 *   - デフォルト: 'asc'
 * 
 * 使用例:
 * - /api/admin/customers?status=active&sortBy=email&sortOrder=asc
 * - /api/admin/customers?status=all&sortBy=createdAt&sortOrder=desc
 * - /api/admin/customers (デフォルト: activeのみ表示)
 */

// Stripeインスタンスの初期化（最新のAPIバージョンを使用）
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export async function GET(request: NextRequest) {
  try {
    console.log('=== 顧客データ取得開始 ===');
    
    // クエリパラメータの取得
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'active'; // デフォルトはactive
    const sortBy = searchParams.get('sortBy') || 'subscriptionStatus'; // デフォルトはsubscriptionStatus
    const sortOrder = searchParams.get('sortOrder') || 'asc'; // デフォルトはasc
    
    console.log('フィルタ設定:', { statusFilter, sortBy, sortOrder });
    console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '設定済み' : '未設定');
    console.log('Stripe API Version:', '2025-07-30.basil');
    
    // Stripeキーが設定されていない場合はテスト用データを返す
    if (!process.env.STRIPE_SECRET_KEY) {
      console.log('Stripeキーが設定されていないため、テスト用データを返します');
      const testCustomers = [
        {
          customerId: 'cus_test_001',
          lineId: 'line_test_001',
          email: 'test1@example.com',
          subscriptionStatus: 'active',
          subscriptionName: 'テストプラン',
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          paymentStatus: 'アクティブ',
        },
        {
          customerId: 'cus_test_002',
          lineId: '',
          email: 'test2@example.com',
          subscriptionStatus: 'trialing',
          subscriptionName: 'トライアルプラン',
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          paymentStatus: 'トライアル中',
        }
      ];
      
      // テストデータのフィルタリングとソート
      const filteredTestCustomers = testCustomers.filter(customer => 
        statusFilter === 'all' || customer.subscriptionStatus === statusFilter
      );
      
      const sortedTestCustomers = sortCustomers(filteredTestCustomers, sortBy, sortOrder);
      
      return NextResponse.json({
        success: true,
        customers: sortedTestCustomers,
        totalCount: sortedTestCustomers.length,
        statusBreakdown: {
          active: testCustomers.filter(c => c.subscriptionStatus === 'active').length,
          trialing: testCustomers.filter(c => c.subscriptionStatus === 'trialing').length,
          pastDue: 0,
        },
        message: 'テスト用データ（Stripeキーが設定されていません）',
        filters: { statusFilter, sortBy, sortOrder }
      });
    }

    // Stripe接続テスト
    console.log('=== Stripe接続テスト開始 ===');
    try {
      const account = await stripe.accounts.retrieve();
      console.log('Stripe接続成功:', {
        id: account.id,
        business_type: account.business_type,
        charges_enabled: account.charges_enabled,
        country: account.country
      });
    } catch (accountError) {
      console.log('Stripe接続テスト失敗（アカウント情報取得）:', accountError);
      // アカウント情報が取得できない場合でも続行
    }

    // 顧客データを先に取得して確認
    console.log('=== 顧客データ取得開始 ===');
    const customersList = await stripe.customers.list({
      limit: 10, // 10件のみ取得
    });
    console.log(`総顧客数: ${customersList.data.length} (最大10件まで表示)`);
    
    if (customersList.data.length > 0) {
      console.log('=== 顧客詳細情報 (10件まで) ===');
      customersList.data.forEach((customer, index) => {
        console.log(`顧客 ${index + 1}:`, {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          phone: customer.phone,
          created: new Date(customer.created * 1000).toISOString(),
          updated: (customer as Stripe.Customer & { updated?: number }).updated ? new Date((customer as Stripe.Customer & { updated?: number }).updated! * 1000).toISOString() : 'なし',
          metadata: customer.metadata,
          default_source: customer.default_source,
          invoice_settings: customer.invoice_settings,
          address: customer.address,
          shipping: customer.shipping,
          tax_exempt: customer.tax_exempt,
          currency: customer.currency,
          delinquent: customer.delinquent,
          discount: customer.discount,
          livemode: customer.livemode,
          preferred_locales: customer.preferred_locales,
          sources: customer.sources ? `データあり (${customer.sources.data.length}件)` : 'なし',
          subscriptions: customer.subscriptions ? `データあり (${customer.subscriptions.data.length}件)` : 'なし',
          tax_ids: customer.tax_ids ? `データあり (${customer.tax_ids.data.length}件)` : 'なし',
        });
      });
      
      // 最初の顧客の詳細情報を特別に表示
      const firstCustomer = customersList.data[0];
      console.log('=== 最初の顧客の完全な詳細 ===');
      console.log('顧客オブジェクト全体:', JSON.stringify(firstCustomer, null, 2));
      
      // 顧客のサブスクリプション情報を個別に取得（10件まで）
      console.log('=== 各顧客のサブスクリプション情報 (10件まで) ===');
      for (let i = 0; i < customersList.data.length; i++) { // 全件処理（最大10件）
        const customer = customersList.data[i];
        console.log(`\n--- 顧客 ${i + 1} (${customer.id}) のサブスクリプション調査 ---`);
        
        try {
          const customerSubscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            limit: 10, // 各顧客のサブスクリプションも10件まで
          });
          console.log(`顧客 ${customer.id} のサブスクリプション数: ${customerSubscriptions.data.length}`);
          
          if (customerSubscriptions.data.length > 0) {
            customerSubscriptions.data.forEach((sub, subIndex) => {
              console.log(`  サブスクリプション ${subIndex + 1}:`, {
                id: sub.id,
                status: sub.status,
                created: new Date(sub.created * 1000).toISOString(),
                current_period_start: (sub as Stripe.Subscription & { current_period_start?: number }).current_period_start ? new Date((sub as Stripe.Subscription & { current_period_start?: number }).current_period_start! * 1000).toISOString() : 'なし',
                current_period_end: (sub as Stripe.Subscription & { current_period_end?: number }).current_period_end ? new Date((sub as Stripe.Subscription & { current_period_end?: number }).current_period_end! * 1000).toISOString() : 'なし',
                cancel_at_period_end: sub.cancel_at_period_end,
                ended_at: sub.ended_at ? new Date(sub.ended_at * 1000).toISOString() : 'なし',
                canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : 'なし',
                metadata: sub.metadata,
                items_count: sub.items.data.length,
              });
            });
          } else {
            console.log(`  顧客 ${customer.id} にはサブスクリプションが存在しません`);
          }
          
          // 顧客の支払い方法も確認
          const paymentMethods = await stripe.paymentMethods.list({
            customer: customer.id,
            limit: 5, // 5件まで
          });
          console.log(`  支払い方法数: ${paymentMethods.data.length}`);
          
          // 顧客の請求書も確認
          const invoices = await stripe.invoices.list({
            customer: customer.id,
            limit: 5, // 5件まで
          });
          console.log(`  請求書数: ${invoices.data.length}`);
          
        } catch (error) {
          console.log(`  顧客 ${customer.id} の情報取得でエラー:`, error);
        }
      }
    } else {
      console.log('顧客データが存在しません');
    }

    // サブスクリプション一覧を取得
    console.log('=== サブスクリプションデータ取得開始 ===');
    
    // まず、ステータスを指定せずに全サブスクリプションを取得
    console.log('全サブスクリプション取得中...');
    const allSubscriptionsRaw = await stripe.subscriptions.list({
      limit: 100,
    });
    console.log(`総サブスクリプション数（全ステータス）: ${allSubscriptionsRaw.data.length}`);
    
    if (allSubscriptionsRaw.data.length > 0) {
      console.log('サブスクリプションのステータス一覧:');
      allSubscriptionsRaw.data.forEach((sub, index) => {
        console.log(`${index + 1}. ID: ${sub.id}, Status: ${sub.status}, Customer: ${sub.customer}`);
      });
    } else {
      console.log('サブスクリプションデータが存在しません');
      
      // サブスクリプションが存在しない場合の詳細調査
      console.log('=== サブスクリプション詳細調査開始 ===');
      
      // 1. 支払い方法の確認
      try {
        const paymentMethods = await stripe.paymentMethods.list({
          limit: 10,
        });
        console.log(`支払い方法数: ${paymentMethods.data.length}`);
        if (paymentMethods.data.length > 0) {
          console.log('最初の支払い方法:', {
            id: paymentMethods.data[0].id,
            type: paymentMethods.data[0].type,
            customer: paymentMethods.data[0].customer
          });
        }
      } catch (pmError) {
        console.log('支払い方法取得エラー:', pmError);
      }
      
      // 2. 価格設定の確認
      try {
        const prices = await stripe.prices.list({
          limit: 10,
          active: true,
        });
        console.log(`アクティブな価格設定数: ${prices.data.length}`);
        if (prices.data.length > 0) {
          console.log('最初の価格設定:', {
            id: prices.data[0].id,
            unit_amount: prices.data[0].unit_amount,
            currency: prices.data[0].currency,
            recurring: prices.data[0].recurring
          });
        }
      } catch (priceError) {
        console.log('価格設定取得エラー:', priceError);
      }
      
      // 3. 商品の確認
      try {
        const products = await stripe.products.list({
          limit: 10,
          active: true,
        });
        console.log(`アクティブな商品数: ${products.data.length}`);
        if (products.data.length > 0) {
          console.log('最初の商品:', {
            id: products.data[0].id,
            name: products.data[0].name,
            description: products.data[0].description
          });
        }
      } catch (productError) {
        console.log('商品取得エラー:', productError);
      }
      
      // 4. 請求書の確認
      try {
        const invoices = await stripe.invoices.list({
          limit: 10,
        });
        console.log(`請求書数: ${invoices.data.length}`);
        if (invoices.data.length > 0) {
          console.log('最初の請求書:', {
            id: invoices.data[0].id,
            customer: invoices.data[0].customer,
            subscription: (invoices.data[0] as Stripe.Invoice & { subscription?: string }).subscription,
            status: invoices.data[0].status
          });
        }
      } catch (invoiceError) {
        console.log('請求書取得エラー:', invoiceError);
      }
    }

    // 各ステータスごとにサブスクリプションを取得
    console.log('=== 各ステータスごとのサブスクリプション取得 ===');
    
    const allSubscriptions: Stripe.Subscription[] = [];
    
    // statusFilterに基づいて必要なステータスのサブスクリプションのみを取得
    if (statusFilter === 'all' || statusFilter === 'active') {
      console.log('アクティブなサブスクリプション取得中...');
      const subscriptions = await stripe.subscriptions.list({
        status: 'active',
        expand: ['data.customer'],
        limit: 100,
      });
      console.log(`アクティブなサブスクリプション数: ${subscriptions.data.length}`);
      allSubscriptions.push(...subscriptions.data);
    }

    if (statusFilter === 'all' || statusFilter === 'past_due') {
      // 過去の支払い遅延があるが継続中のサブスクリプションも取得
      console.log('支払い遅延中のサブスクリプション取得中...');
      const pastDueSubscriptions = await stripe.subscriptions.list({
        status: 'past_due',
        expand: ['data.customer'],
        limit: 100,
      });
      console.log(`支払い遅延中のサブスクリプション数: ${pastDueSubscriptions.data.length}`);
      allSubscriptions.push(...pastDueSubscriptions.data);
    }

    if (statusFilter === 'all' || statusFilter === 'trialing') {
      // トライアル期間中のサブスクリプションも取得
      console.log('トライアル中のサブスクリプション取得中...');
      const trialingSubscriptions = await stripe.subscriptions.list({
        status: 'trialing',
        expand: ['data.customer'],
        limit: 100,
      });
      console.log(`トライアル中のサブスクリプション数: ${trialingSubscriptions.data.length}`);
      allSubscriptions.push(...trialingSubscriptions.data);
    }

    if (statusFilter === 'all' || statusFilter === 'canceled') {
      // キャンセル済みのサブスクリプションも確認
      console.log('キャンセル済みのサブスクリプション取得中...');
      const canceledSubscriptions = await stripe.subscriptions.list({
        status: 'canceled',
        limit: 100,
      });
      console.log(`キャンセル済みのサブスクリプション数: ${canceledSubscriptions.data.length}`);
      allSubscriptions.push(...canceledSubscriptions.data);
    }

    console.log(`フィルタ適用後の総サブスクリプション数: ${allSubscriptions.length}`);
    console.log('=== サブスクリプション取得完了 ===');
    
    // 継続中のサブスクリプションがない場合の対処
    if (allSubscriptions.length === 0) {
      console.log('サブスクリプションが存在しないため、全顧客からデータを構築します');
      
      // 顧客データから直接情報を構築
      const customersFromCustomers = await Promise.all(
        customersList.data.map(async (customer) => {
          console.log(`顧客 ${customer.id} 処理中...`);
          
          // StripeのメタデータからLINE連携情報を取得
          const lineId = await getLineIdFromStripe(customer.id);
          console.log(`顧客 ${customer.id} のLINE ID: ${lineId}`);
          
          return {
            customerId: customer.id,
            lineId: lineId || '',
            email: customer.email || '',
            subscriptionStatus: 'unknown', // サブスクリプションがない場合
            subscriptionName: '不明',
            currentPeriodStart: new Date().toISOString(),
            currentPeriodEnd: new Date().toISOString(),
            createdAt: new Date(customer.created * 1000).toISOString(),
            paymentStatus: 'サブスクリプションなし',
          };
        })
      );

      console.log(`顧客データから構築した顧客数: ${customersFromCustomers.length}`);

      // フィルタリングとソートを適用
      const filteredAndSortedCustomersFromCustomers = sortCustomers(customersFromCustomers, sortBy, sortOrder);
      console.log(`フィルタリング・ソート後の顧客数: ${filteredAndSortedCustomersFromCustomers.length}`);

      return NextResponse.json({
        success: true,
        customers: filteredAndSortedCustomersFromCustomers,
        totalCount: filteredAndSortedCustomersFromCustomers.length,
        statusBreakdown: {
          active: 0,
          trialing: 0,
          pastDue: 0,
          canceled: 0,
          unknown: customersFromCustomers.length,
        },
        message: 'サブスクリプションが存在しないため、全顧客データを返します',
        filters: { statusFilter, sortBy, sortOrder }
      });
    }

    // 顧客データを整形
    const customers = await Promise.all(
      allSubscriptions.map(async (subscription, index) => {
        console.log(`サブスクリプション ${index + 1} 処理中:`, subscription.id);
        
        // customerプロパティが文字列IDの場合は、顧客情報を取得
        let customer: Stripe.Customer;
        let customerId: string;
        
        if (typeof subscription.customer === 'string') {
          customerId = subscription.customer;
          try {
            customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
            console.log(`顧客ID: ${customerId}, メール: ${customer.email}`);
          } catch (error) {
            console.error(`顧客 ${customerId} の取得に失敗:`, error);
            // エラーの場合はスキップ
            return null;
          }
        } else if (subscription.customer && typeof subscription.customer === 'object') {
          // expandオプションで取得された顧客情報
          customer = subscription.customer as Stripe.Customer;
          customerId = customer.id;
          console.log(`顧客ID: ${customerId}, メール: ${customer.email} (expand済み)`);
        } else {
          console.error(`サブスクリプション ${subscription.id} の顧客情報が不正:`, subscription.customer);
          return null;
        }
        
        // StripeのメタデータからLINE連携情報を取得
        const lineId = await getLineIdFromStripe(customerId);
        console.log(`LINE ID: ${lineId}`);
        
        // サブスクリプションの詳細情報を取得
        const subscriptionDetails = await getSubscriptionDetails(subscription.id);
        console.log(`サブスクリプション詳細:`, subscriptionDetails);
        
        // 期間情報を安全に取得
        const currentPeriodStart = (subscription as Stripe.Subscription & { current_period_start?: number }).current_period_start 
          ? new Date((subscription as Stripe.Subscription & { current_period_start?: number }).current_period_start! * 1000).toISOString()
          : new Date().toISOString();
          
        const currentPeriodEnd = (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end
          ? new Date((subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end! * 1000).toISOString()
          : new Date().toISOString();
        
        return {
          customerId: customerId,
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

    console.log(`処理完了した顧客数: ${customers.length}`);

    // nullの値を除外してから重複を除去
    const validCustomers = customers.filter(customer => customer !== null);
    console.log(`有効な顧客数: ${validCustomers.length}`);

    // 重複する顧客を除去（同じ顧客が複数のサブスクリプションを持っている場合）
    const uniqueCustomers = validCustomers.filter((customer, index, self) => 
      index === self.findIndex(c => c.customerId === customer.customerId)
    );

    console.log(`重複除去後の顧客数: ${uniqueCustomers.length}`);

    // フィルタリングとソートを適用
    const filteredAndSortedCustomers = sortCustomers(uniqueCustomers, sortBy, sortOrder);
    console.log(`フィルタリング・ソート後の顧客数: ${filteredAndSortedCustomers.length}`);

    return NextResponse.json({
      success: true,
      customers: filteredAndSortedCustomers,
      totalCount: filteredAndSortedCustomers.length,
      statusBreakdown: {
        active: uniqueCustomers.filter(c => c.subscriptionStatus === 'active').length,
        trialing: uniqueCustomers.filter(c => c.subscriptionStatus === 'trialing').length,
        pastDue: uniqueCustomers.filter(c => c.subscriptionStatus === 'past_due').length,
        canceled: uniqueCustomers.filter(c => c.subscriptionStatus === 'canceled').length,
      },
      filters: { statusFilter, sortBy, sortOrder }
    });
  } catch (error) {
    console.error('顧客データ取得エラー:', error);
    return NextResponse.json(
      { success: false, message: '顧客データの取得に失敗しました。', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// 顧客データのソート関数
function sortCustomers(customers: CustomerData[], sortBy: string, sortOrder: string) {
  return customers.sort((a, b) => {
    let aValue: string | number = a[sortBy as keyof CustomerData];
    let bValue: string | number = b[sortBy as keyof CustomerData];

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
}

// StripeからLINE連携情報を取得
async function getLineIdFromStripe(customerId: string): Promise<string | null> {
  try {
    // customerIdの検証
    if (!customerId || typeof customerId !== 'string' || customerId.trim() === '') {
      console.error('無効なcustomerId:', customerId);
      return null;
    }

    console.log(`顧客 ${customerId} のLINE ID取得開始`);
    
    // 顧客のメタデータからLINE IDを取得
    const customer = await stripe.customers.retrieve(customerId);
    
    if (customer.deleted) {
      console.log(`顧客 ${customerId} は削除済み`);
      return null;
    }

    // メタデータからLINE IDを取得
    const lineId = customer.metadata.line_id || customer.metadata.lineId || customer.metadata.line_user_id;
    
    if (lineId) {
      console.log(`顧客 ${customerId} のLINE ID: ${lineId} (メタデータから)`);
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
      if (subscriptionLineId) {
        console.log(`顧客 ${customerId} のLINE ID: ${subscriptionLineId} (サブスクリプションメタデータから)`);
        return subscriptionLineId;
      }
    }

    console.log(`顧客 ${customerId} のLINE ID: 見つかりません`);
    return null;
  } catch (error) {
    console.error(`顧客 ${customerId} のLINE ID取得エラー:`, error);
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
