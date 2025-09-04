import { sendMetaConversion } from '@/lib/meta-conversions'
import { getCampaignMapping, getDefaultCampaignMapping } from '@/lib/campaign-mapping'

export interface CampaignConversionData {
  customerEmail?: string
  customerPhone?: string
  amount: number
  currency: string
  eventId: string
  userAgent?: string
  ipAddress?: string
  testEventCode?: string
}

/**
 * キャンペーン別のコンバージョン送信
 */
export async function sendCampaignConversion(
  campaignId: string,
  conversionData: CampaignConversionData
): Promise<{ success: boolean; error?: string; campaignId: string }> {
  try {
    console.log(`Sending conversion for campaign: ${campaignId}`)

    // キャンペーンマッピングを取得
    const campaignMapping = await getCampaignMapping(campaignId)
    
    if (!campaignMapping) {
      console.warn(`Campaign mapping not found for campaign ID: ${campaignId}`)
      return {
        success: false,
        error: `Campaign mapping not found for campaign ID: ${campaignId}`,
        campaignId
      }
    }

    // Meta APIに送信
    const result = await sendMetaConversion(
      campaignMapping.metaAccessToken,
      campaignMapping.metaPixelId,
      {
        ...conversionData,
        campaignId: campaignId
      }
    )

    console.log(`Campaign conversion sent successfully for campaign ${campaignId}:`, result)
    
    return {
      success: true,
      campaignId
    }
  } catch (error) {
    console.error(`Failed to send campaign conversion for campaign ${campaignId}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      campaignId
    }
  }
}

/**
 * デフォルトのコンバージョン送信（キャンペーンIDがない場合）
 */
export async function sendDefaultConversion(
  conversionData: CampaignConversionData
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Sending default conversion (no campaign ID)')

    // デフォルトのキャンペーンマッピングを取得
    const defaultMapping = getDefaultCampaignMapping()
    
    if (!defaultMapping) {
      console.warn('Default campaign mapping not configured')
      return {
        success: false,
        error: 'Default campaign mapping not configured'
      }
    }

    // Meta APIに送信
    const result = await sendMetaConversion(
      defaultMapping.metaAccessToken,
      defaultMapping.metaPixelId,
      conversionData
    )

    console.log('Default conversion sent successfully:', result)
    
    return {
      success: true
    }
  } catch (error) {
    console.error('Failed to send default conversion:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * 複数キャンペーンへの同時送信
 */
export async function sendMultipleCampaignConversions(
  campaignIds: string[],
  conversionData: CampaignConversionData
): Promise<Array<{ success: boolean; error?: string; campaignId: string }>> {
  console.log(`Sending conversion to multiple campaigns: ${campaignIds.join(', ')}`)

  const results = await Promise.allSettled(
    campaignIds.map(campaignId => 
      sendCampaignConversion(campaignId, conversionData)
    )
  )

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    } else {
      return {
        success: false,
        error: result.reason?.message || 'Unknown error',
        campaignId: campaignIds[index]
      }
    }
  })
}
