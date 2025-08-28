import Stripe from 'stripe';
import { StripeCustomerSearchResponse } from '@/types';

// Stripeの初期化を安全に行う
let stripe: Stripe | null = null;

try {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (stripeSecretKey) {
    stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-08-27.basil',
    });
    console.log('Stripe初期化完了:', {
      hasSecretKey: true,
      apiVersion: '2025-08-27.basil'
    });
  } else {
    console.warn('STRIPE_SECRET_KEYが設定されていません - Stripe機能は無効化されます');
  }
} catch (error) {
  console.error('Stripe初期化エラー:', error);
}

export async function findCustomerByEmail(email: string): Promise<StripeCustomerSearchResponse> {
  if (!stripe) {
    return {
      success: false,
      customers: [],
      message: 'Stripeが初期化されていません。環境変数を確認してください。',
    };
  }

  try {
    console.log('Stripe顧客検索開始:', email);
    
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    });
    
    console.log('Stripe API応答:', customers);

    if (customers.data.length === 0) {
      console.log('顧客が見つかりませんでした');
      return {
        success: false,
        customers: [],
        message: '指定されたメールアドレスで顧客が見つかりませんでした。',
      };
    }

    const customer = customers.data[0];
    console.log('顧客が見つかりました:', {
      id: customer.id,
      email: customer.email,
      metadata: customer.metadata
    });
    
    return {
      success: true,
      customers: [{
        id: customer.id,
        email: customer.email || '',
        metadata: customer.metadata,
      }],
    };
  } catch (error) {
    console.error('Stripe顧客検索エラー:', error);
    return {
      success: false,
      customers: [],
      message: '顧客検索中にエラーが発生しました。',
    };
  }
}

export async function updateCustomerLineId(customerId: string, lineId: string): Promise<boolean> {
  if (!stripe) {
    console.error('Stripeが初期化されていません');
    return false;
  }

  try {
    console.log('Stripe顧客更新開始:', { customerId, lineId });
    
    const updatedCustomer = await stripe.customers.update(customerId, {
      metadata: {
        lineId: lineId,
      },
    });
    
    console.log('Stripe顧客更新成功:', {
      id: updatedCustomer.id,
      metadata: updatedCustomer.metadata
    });
    
    return true;
  } catch (error) {
    console.error('Stripe顧客更新エラー:', error);
    return false;
  }
}
