import Stripe from 'stripe';
import { StripeCustomer, StripeCustomerSearchResponse } from '@/types';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('STRIPE_SECRET_KEYが設定されていません');
}

const stripe = new Stripe(stripeSecretKey!, {
  apiVersion: '2025-07-30.basil',
});

console.log('Stripe初期化完了:', {
  hasSecretKey: !!stripeSecretKey,
  apiVersion: '2025-07-30.basil'
});

export async function findCustomerByEmail(email: string): Promise<StripeCustomerSearchResponse> {
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
