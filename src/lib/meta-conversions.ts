import crypto from 'crypto'

interface MetaConversionData {
  event_name: string
  event_time: number
  user_data: {
    em?: string[] // ハッシュ化されたメールアドレス
    ph?: string[] // ハッシュ化された電話番号
    client_ip_address?: string
    client_user_agent?: string
  }
  custom_data?: {
    value?: number
    currency?: string
    content_type?: string
    content_ids?: string[]
  }
  action_source: string
  event_id?: string
}

interface MetaConversionResponse {
  events_received: number
  messages: string[]
  fbtrace_id: string
}

/**
 * 文字列をSHA256でハッシュ化する
 */
function hashString(input: string): string {
  return crypto.createHash('sha256').update(input.toLowerCase().trim()).digest('hex')
}

/**
 * Meta Conversions APIにコンバージョンデータを送信する
 */
export async function sendMetaConversion(
  accessToken: string,
  pixelId: string,
  conversionData: {
    customerEmail?: string
    customerPhone?: string
    amount: number
    currency: string
    eventId: string
    userAgent?: string
    ipAddress?: string
  }
): Promise<MetaConversionResponse> {
  const endpoint = `https://graph.facebook.com/v18.0/${pixelId}/events`
  
  // ユーザーデータを準備
  const userData: MetaConversionData['user_data'] = {}
  
  if (conversionData.customerEmail) {
    userData.em = [hashString(conversionData.customerEmail)]
  }
  
  if (conversionData.customerPhone) {
    userData.ph = [hashString(conversionData.customerPhone)]
  }
  
  if (conversionData.ipAddress) {
    userData.client_ip_address = conversionData.ipAddress
  }
  
  if (conversionData.userAgent) {
    userData.client_user_agent = conversionData.userAgent
  }

  // コンバージョンデータを構築
  const metaData: MetaConversionData = {
    event_name: 'Purchase',
    event_time: Math.floor(Date.now() / 1000),
    user_data: userData,
    custom_data: {
      value: conversionData.amount / 100, // Stripeはセント単位なので円に変換
      currency: conversionData.currency.toUpperCase(),
      content_type: 'product',
      content_ids: ['stripe_purchase']
    },
    action_source: 'website',
    event_id: conversionData.eventId
  }

  const requestBody = {
    data: [metaData],
    access_token: accessToken
  }

  try {
    console.log('Sending Meta conversion data:', {
      pixelId,
      eventId: conversionData.eventId,
      amount: conversionData.amount,
      currency: conversionData.currency
    })

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Meta API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`Meta API error: ${response.status} ${response.statusText}`)
    }

    const result: MetaConversionResponse = await response.json()
    console.log('Meta conversion sent successfully:', result)
    
    return result
  } catch (error) {
    console.error('Failed to send Meta conversion:', error)
    throw error
  }
}

/**
 * テスト用のMetaコンバージョン送信
 */
export async function sendTestMetaConversion(
  accessToken: string,
  pixelId: string
): Promise<MetaConversionResponse> {
  return sendMetaConversion(accessToken, pixelId, {
    customerEmail: 'test@example.com',
    amount: 1000, // 10円
    currency: 'jpy',
    eventId: `test_${Date.now()}`,
    userAgent: 'Test User Agent',
    ipAddress: '127.0.0.1'
  })
}
